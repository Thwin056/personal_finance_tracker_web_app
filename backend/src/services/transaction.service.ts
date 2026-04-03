import axios from "axios";
import TransactionModel, { TransactionTypeEnum } from "../models/transaction.model";
import {
    BadRequestException,
    InternalServerException,
    NotFoundException,
} from "../utils/app-error";
import { calculateNextOccurrence } from "../utils/helper";
import { CreateTransactionType, UpdateTransactionType } from "../validators/transaction.validator";
import { genAI, genAIModel } from "../config/google-ai.config";
import { createPartFromBase64, createUserContent } from "@google/genai";
import { receiptPrompt } from "../utils/prompt";

export const createTransactionService = async (
    body: CreateTransactionType,
    userId: string
) => {
    let nextRecurringDate: Date | undefined;
    const currentDate = new Date();

    if (body.isRecurring && body.recurringInterval) {
        const calulatedDate = calculateNextOccurrence(
            body.date,
            body.recurringInterval
        );

        nextRecurringDate =
            calulatedDate < currentDate
            ? calculateNextOccurrence(currentDate, body.recurringInterval)
            : calulatedDate;
    }

    const transaction = await TransactionModel.create({
        ...body,
        userId,
        category: body.category,
        amount: Number(body.amount),
        isRecurring: body.isRecurring || false,
        recurringInterval: body.recurringInterval || null,
        nextRecurringDate,
        lastProcessed: null,
    });

    return transaction;
};

export const getAllTransactionService = async (
    userId: string,
    filters: {
        keyword?: string;
        type?: keyof typeof TransactionTypeEnum;
        recurringStatus?: "RECURRING" | "NON_RECURRING";
    },
    pagination: {
        pageSize: number;
        pageNumber: number;
    }
) => {
    const { keyword, type, recurringStatus } = filters;

    const filterConditions: Record<string, any> = {
        userId,
    };

    if (keyword) {
        filterConditions.$or = [
            { title: { $regex: keyword, $options: "i" } },
            { category: { $regex: keyword, $options: "i" } },
        ];
    }

    if (type) {
        filterConditions.type = type;
    }

    if (recurringStatus) {
        if (recurringStatus === "RECURRING") {
            filterConditions.isRecurring = true;
        } else if (recurringStatus === "NON_RECURRING") {
            filterConditions.isRecurring = false;
        }
    }

    const { pageSize, pageNumber } = pagination;
    const skip = (pageNumber - 1) * pageSize;

    const [transactions, totalCount] = await Promise.all([
        TransactionModel.find(filterConditions)
            .skip(skip)
            .limit(pageSize)
            .sort({ createdAt: -1 }),
        TransactionModel.countDocuments(filterConditions),
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return {
        transactions,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages,
            skip,
        },
    };
};

export const getTransactionByIdService = async (
    userId: string,
    transactionId: string
) => {
    const transaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction) throw new NotFoundException("Transaction not found");

    return transaction;
};

export const duplicateTransactionService = async (
    userId: string,
    transactionId: string
) => {
    const transaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!transaction) throw new NotFoundException("Transaction not found");

    const duplicated = await TransactionModel.create({
        ...transaction.toObject(),
        _id: undefined,
        title: `Duplicate - ${transaction.title}`,
        description: transaction.description
            ? `${transaction.description} (Duplicate)`
            : "Duplicated transaction",
        isRecurring: false,
        recurringInterval: undefined,
        nextRecurringDate: undefined,
        createdAt: undefined,
        updatedAt: undefined,
    });

    return duplicated;
};

export const updateTransactionService = async (
    userId: string,
    transactionId: string,
    body: UpdateTransactionType
) => {
    const existingTransaction = await TransactionModel.findOne({
        _id: transactionId,
        userId,
    });
    if (!existingTransaction)
        throw new NotFoundException("Transaction not found");

    const now = new Date();
    const isRecurring = body.isRecurring ?? existingTransaction.isRecurring;

    const date =
        body.date !== undefined ? new Date(body.date) : existingTransaction.date;

    const recurringInterval =
        body.recurringInterval || existingTransaction.recurringInterval;

    let nextRecurringDate: Date | undefined;

    if (isRecurring && recurringInterval) {
        const calulatedDate = calculateNextOccurrence(date, recurringInterval);

        nextRecurringDate =
            calulatedDate < now
            ? calculateNextOccurrence(now, recurringInterval)
            : calulatedDate;
    }

    existingTransaction.set({
        ...(body.title && { title: body.title }),
        ...(body.description && { description: body.description }),
        ...(body.category && { category: body.category }),
        ...(body.type && { type: body.type }),
        ...(body.paymentMethod && { paymentMethod: body.paymentMethod }),
        ...(body.amount !== undefined && { amount: Number(body.amount) }),
        date,
        isRecurring,
        recurringInterval,
        nextRecurringDate,
    });

    await existingTransaction.save();

    return;
};

export const deleteTransactionService = async (
    userId: string,
    transactionId: string
) => {
    const deleted = await TransactionModel.findByIdAndDelete({
        _id: transactionId,
        userId,
    });
    if (!deleted) throw new NotFoundException("Transaction not found");

    return;
};

export const bulkDeleteTransactionService = async (
    userId: string,
    transactionIds: string[]
) => {
    const result = await TransactionModel.deleteMany({
        _id: { $in: transactionIds },
        userId,
    });

    if (result.deletedCount === 0)
        throw new NotFoundException("No transations found");

    return {
        sucess: true,
        deletedCount: result.deletedCount,
    };
};

export const bulkTransactionService = async (
    userId: string,
    transactions: CreateTransactionType[]
) => {
    try {
        const bulkOps = transactions.map((tx) => ({
            insertOne: {
                document: {
                    ...tx,
                    userId,
                    isRecurring: false,
                    nextRecurringDate: null,
                    recurringInterval: null,
                    lastProcesses: null,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            },
        }));

        const result = await TransactionModel.bulkWrite(bulkOps, {
            ordered: true,
        });

        return {
            insertedCount: result.insertedCount,
            success: true,
        };
    } catch (error) {
        throw error;
    }
};

const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

const isTemporaryGeminiUnavailableError = (error: any) => {
    const message = typeof error?.message === "string" ? error.message : "";

    return (
        error?.status === 503 ||
        (message.includes("503 Service Unavailable") &&
            message.includes('"status":"UNAVAILABLE"')) ||
        message.includes("currently experiencing high demand")
    );
};

export const scanReceiptService = async (
    file: Express.Multer.File | undefined
) => {
    if (!file) throw new BadRequestException("No file uploaded");

    try {
        if (!file.path) throw new BadRequestException("failed to upload file");

        console.log(file.path);

        const responseData = await axios.get(file.path, {
            responseType: "arraybuffer",
        });
        const base64String = Buffer.from(responseData.data).toString("base64");

        if (!base64String) throw new BadRequestException("Could not process file");

        console.log("Gemini AI generating...");

        let result: any;
        let lastGeminiError: any;

        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                result = await genAI.models.generateContent({
                    model: genAIModel,
                    contents: [
                        createUserContent([
                            receiptPrompt,
                            createPartFromBase64(base64String, file.mimetype),
                        ]),
                    ],
                    config: {
                        temperature: 0,
                        topP: 1,
                        responseMimeType: "application/json",
                    },
                });
                lastGeminiError = null;
                break;
            } catch (error: any) {
                lastGeminiError = error;

                if (!isTemporaryGeminiUnavailableError(error) || attempt === 3) {
                    throw error;
                }

                const retryDelay = attempt * 1500;
                console.warn(
                    `Gemini receipt scan temporarily unavailable. Retrying in ${retryDelay}ms (attempt ${attempt}/3).`
                );
                await sleep(retryDelay);
            }
        }

        if (!result && lastGeminiError) {
            throw lastGeminiError;
        }

        console.log("Gemini AI finished generating...");
        console.log(result);

        const response = result.text;
        const cleanedText = response?.replace(/```(?:json)?\n?/g, "").trim();

        if (!cleanedText)
            return {
                error: "Could not read reciept  content",
            };

        const data = JSON.parse(cleanedText);

        if (!data.amount || !data.date) {
            return { error: "Reciept missing required information" };
        }

        return {
            title: data.title || "Receipt",
            amount: data.amount,
            date: data.date,
            description: data.description,
            category: data.category,
            paymentMethod: data.paymentMethod,
            type: data.type,
            receiptUrl: file.path,
        };
    } catch (error: any) {
        console.error("Gemini receipt scan failed", {
            message: error?.message,
            status: error?.status,
            code: error?.code,
            details: error?.errorDetails || error?.details,
            response: error?.response?.data,
        });

        if (error?.status === 403) {
            throw new InternalServerException(
                "Gemini access was denied. Check your API key, project permissions, billing, and model access."
            );
        }

        if (error?.status === 429) {
            throw new InternalServerException(
                "Gemini quota or rate limit was exceeded. Please try again later or check your Google AI usage limits."
            );
        }

        if (error?.status === 401) {
            throw new InternalServerException(
                "Gemini authentication failed. Verify your GEMINI_API_KEY or GOOGLE_API_KEY."
            );
        }

        if (isTemporaryGeminiUnavailableError(error)) {
            throw new InternalServerException(
                "Gemini is temporarily experiencing high demand. Please try the receipt scan again in a few moments."
            );
        }

        if (
            typeof error?.message === "string" &&
            error.message.includes("404 Not Found") &&
            error.message.includes("model")
        ) {
            throw new InternalServerException(
                "The configured Gemini model is unavailable for this project. Update GEMINI_MODEL to a current supported model."
            );
        }

        throw new InternalServerException("Receipt scanning service unavailable");
    }
};

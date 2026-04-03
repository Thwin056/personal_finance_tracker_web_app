import { apiClient } from "@/app/api-client";
import {
  GenerateReportParams,
  GenerateReportResponse,
  GetAllReportResponse,
  UpdateReportSettingParams,
} from "./reportType";

export const reportApi = apiClient.injectEndpoints({
  endpoints: (builder) => ({
    
    getAllReports: builder.query<GetAllReportResponse, {pageNumber: number, pageSize: number}>({
      query: (params) => {
        const { pageNumber = 1, pageSize = 20 } = params;
        return ({
          url: "/report/all",
          method: "GET",
          params: { pageNumber, pageSize },
        });
      },
    }),

    generateReport: builder.mutation<GenerateReportResponse, GenerateReportParams>({
      query: ({ from, to }) => ({
        url: "/report/generate",
        method: "GET",
        params: { from, to },
      }),
    }),

    resendReportEmail: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/report/resend/${id}`,
        method: "POST",
      }),
    }),

    updateReportSetting: builder.mutation<void, UpdateReportSettingParams>({
      query: (payload) => ({
        url: "/report/update-setting",
        method: "PUT",
        body: payload,
      }),
    }),
  }),
});

export const {
    useGetAllReportsQuery,
    useGenerateReportMutation,
    useResendReportEmailMutation,
    useUpdateReportSettingMutation
} = reportApi;

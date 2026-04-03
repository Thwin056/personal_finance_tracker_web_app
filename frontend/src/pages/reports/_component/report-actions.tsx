import { useMemo, useState } from "react";
import { format, parse } from "date-fns";
import { Loader, Mail, RefreshCw, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useGenerateReportMutation,
  useResendReportEmailMutation,
} from "@/features/report/reportAPI";
import { ReportType } from "@/features/report/reportType";
import { formatCurrency } from "@/lib/format-currency";

const parseReportPeriod = (period: string) => {
  const match = period.match(
    /^([A-Za-z]+)\s+(\d{1,2})\s*[–-]\s*(\d{1,2}),\s*(\d{4})$/
  );

  if (!match) {
    return null;
  }

  const [, month, fromDay, toDay, year] = match;
  const fromDate = parse(`${month} ${fromDay}, ${year}`, "MMMM d, yyyy", new Date());
  const toDate = parse(`${month} ${toDay}, ${year}`, "MMMM d, yyyy", new Date());

  return {
    from: format(fromDate, "yyyy-MM-dd"),
    to: format(toDate, "yyyy-MM-dd"),
  };
};

const ReportActions = ({ report }: { report: ReportType }) => {
  const [open, setOpen] = useState(false);
  const [generateReport, { data, isLoading }] = useGenerateReportMutation();
  const [resendReportEmail, { isLoading: isSendingEmail }] =
    useResendReportEmailMutation();

  const periodRange = useMemo(() => parseReportPeriod(report.period), [report.period]);

  const handleOpenChange = (value: boolean) => {
    setOpen(value);
  };

  const handleGenerateReport = async () => {
    if (!periodRange) {
      toast.error("This report period could not be parsed for AI generation");
      return;
    }

    setOpen(true);

    try {
      await generateReport(periodRange).unwrap();
    } catch (error: any) {
      setOpen(false);
      toast.error(error?.data?.message || "Failed to generate AI report");
    }
  };

  const handleResendEmail = async () => {
    try {
      const result = await resendReportEmail(report._id).unwrap();
      toast.success(result.message || "Report email sent successfully");
    } catch (error: any) {
      toast.error(error?.data?.message || "Failed to send report email");
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          className="font-normal"
          onClick={handleGenerateReport}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4" />
          )}
          View AI
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="font-normal"
          onClick={handleResendEmail}
          disabled={isSendingEmail}
        >
          {isSendingEmail ? (
            <Loader className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Resend
        </Button>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>AI Report Insights</DialogTitle>
            <DialogDescription>
              Regenerated insights for {report.period}
            </DialogDescription>
          </DialogHeader>

          {isLoading ? (
            <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Generating AI report...
            </div>
          ) : data ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Income</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(data.summary.income)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Expenses</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(data.summary.expenses)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Balance</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {formatCurrency(data.summary.balance)}
                  </p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-sm text-muted-foreground">Savings Rate</p>
                  <p className="mt-1 text-2xl font-semibold">
                    {data.summary.savingsRate}%
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  AI Insights
                </h3>
                <div className="space-y-2">
                  {data.insights.map((insight, index) => (
                    <div key={`${index}-${insight}`} className="rounded-lg border bg-muted/30 p-4 text-sm">
                      {insight}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Top Categories
                </h3>
                <div className="space-y-2">
                  {data.summary.topCategories.length ? (
                    data.summary.topCategories.map((category) => (
                      <div
                        key={category.name}
                        className="flex items-center justify-between rounded-lg border p-3 text-sm"
                      >
                        <span>{category.name}</span>
                        <span className="text-muted-foreground">
                          {formatCurrency(category.amount)} • {category.percent}%
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      No expense categories found for this period.
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ReportActions;

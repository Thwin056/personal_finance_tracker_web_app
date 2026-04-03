import { useMemo, useState } from "react";
import { ArrowRightLeft } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CURRENCIES = [
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "GBP", label: "British Pound", symbol: "£" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "JPY", label: "Japanese Yen", symbol: "¥" },
  { code: "MMK", label: "Myanmar Kyat", symbol: "K" },
] as const;

const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  JPY: 151.64,
  MMK: 2098,
};

const formatAmount = (amount: number, currencyCode: string) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: currencyCode === "JPY" || currencyCode === "MMK" ? 0 : 2,
  }).format(amount);
};

const Billing = () => {
  const [amount, setAmount] = useState("10");
  const [fromCurrency, setFromCurrency] = useState("GBP");
  const [toCurrency, setToCurrency] = useState("USD");

  const numericAmount = Number(amount) || 0;
  const convertedAmount = useMemo(() => {
    const fromRate = EXCHANGE_RATES[fromCurrency];
    const toRate = EXCHANGE_RATES[toCurrency];

    if (!fromRate || !toRate) return 0;

    const usdBase = numericAmount / fromRate;
    return usdBase * toRate;
  }, [fromCurrency, numericAmount, toCurrency]);

  const fromCurrencyMeta = CURRENCIES.find((currency) => currency.code === fromCurrency);
  const toCurrencyMeta = CURRENCIES.find((currency) => currency.code === toCurrency);

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Currency Converter</h3>
        <p className="text-sm text-muted-foreground">
          Convert between currencies to support international budgeting and spending checks.
        </p>
      </div>
      <Separator />

      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>Quick Conversion</CardTitle>
          <CardDescription>
            Uses built-in exchange rates for demo and project-testing purposes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-[1.2fr_1fr_auto_1fr]">
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">From</label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button type="button" variant="outline" onClick={swapCurrencies}>
                <ArrowRightLeft className="h-4 w-4" />
                Swap
              </Button>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">To</label>
              <Select value={toCurrency} onValueChange={setToCurrency}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="rounded-xl border bg-muted/30 p-5">
            <p className="text-sm text-muted-foreground">Converted Amount</p>
            <p className="mt-2 text-3xl font-semibold tracking-tight">
              {formatAmount(convertedAmount, toCurrency)}
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              {fromCurrencyMeta?.symbol}
              {numericAmount || 0} {fromCurrency} is approximately {toCurrencyMeta?.symbol}
              {convertedAmount.toFixed(toCurrency === "JPY" || toCurrency === "MMK" ? 0 : 2)} {toCurrency}
            </p>
          </div>

          <div className="rounded-xl border p-4 text-sm text-muted-foreground">
            Example: if a user switches <span className="font-medium text-foreground">£10</span> to dollars,
            Finora estimates how much they would receive in <span className="font-medium text-foreground">USD</span>.
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Billing;

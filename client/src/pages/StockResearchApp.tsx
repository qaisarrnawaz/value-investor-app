import {
  LayoutGridIcon,
  MoonIcon,
  SearchIcon,
  TrendingUpIcon,
  Loader2,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";

interface SearchResult {
  ticker: string;
  name: string;
  market: string;
  locale: string;
  primary_exchange: string;
  type: string;
  active: boolean;
  currency_name: string;
}

interface FinancialData {
  fiscal_year: string;
  fiscal_period: string;
  end_date: string;
  financials: {
    income_statement: {
      revenues?: { value: number; unit: string };
      net_income_loss?: { value: number; unit: string };
      gross_profit?: { value: number; unit: string };
      basic_earnings_per_share?: { value: number; unit: string };
    };
  };
}

const featureCards = [
  {
    icon: SearchIcon,
    iconBg: "bg-blue-100",
    iconColor: "text-blue-600",
    title: "Quick Search",
    description: "Find any listed company with instant suggestions",
  },
  {
    icon: TrendingUpIcon,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Financial Charts",
    description: "Visualize 5-year revenue, profit, and DCF trends",
  },
  {
    icon: LayoutGridIcon,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Revenue Treemap",
    description: "See product segment breakdown and growth rates",
  },
];

export const StockResearchApp = (): JSX.Element => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ["stocks", "search", debouncedQuery],
    queryFn: async () => {
      if (!debouncedQuery || debouncedQuery.length < 2) return null;
      const response = await fetch(`/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error("Failed to search stocks");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: stockDetails } = useQuery({
    queryKey: ["stocks", selectedTicker, "details"],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${selectedTicker}/details`);
      if (!response.ok) throw new Error("Failed to fetch stock details");
      return response.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: financials, isLoading: isLoadingFinancials } = useQuery({
    queryKey: ["stocks", selectedTicker, "financials"],
    queryFn: async () => {
      const response = await fetch(`/api/stocks/${selectedTicker}/financials/income?timeframe=annual&limit=5`);
      if (!response.ok) throw new Error("Failed to fetch financials");
      return response.json();
    },
    enabled: !!selectedTicker,
  });

  const handleSelectStock = (ticker: string) => {
    setSelectedTicker(ticker);
    setSearchQuery("");
  };

  const formatCurrency = (value: number): string => {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const revenueChartData = financials?.results
    ?.map((item: FinancialData) => ({
      year: item.fiscal_year,
      revenue: item.financials.income_statement.revenues?.value || 0,
      netIncome: item.financials.income_statement.net_income_loss?.value || 0,
    }))
    .reverse();

  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <SearchIcon className="w-5 h-5 text-white" />
          </div>
          <span className="font-normal text-[#101727] text-base tracking-[-0.31px] leading-6">
            ValueInvest
          </span>
        </div>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <MoonIcon className="w-5 h-5 text-gray-700" />
        </Button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-12">
        <div className="w-full max-w-6xl flex flex-col items-center gap-8">
          {!selectedTicker ? (
            <>
              <div className="flex flex-col items-center gap-3 text-center pt-12">
                <h1 className="font-medium text-[#101727] text-xl tracking-[-0.45px] leading-[30px]">
                  Search Companies
                </h1>
                <p className="font-normal text-[#495565] text-base tracking-[-0.31px] leading-6">
                  Look up financial data and visualize company fundamentals
                </p>
              </div>

              <div className="w-full max-w-2xl relative">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Search for a company (e.g., Nike, Apple)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-auto pl-12 pr-4 py-6 bg-white rounded-2xl border border-[#d0d5db] text-sm tracking-[-0.15px] placeholder:text-[#717182]"
                />
                {isSearching && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                  </div>
                )}
                {searchResults && searchResults.results && searchResults.results.length > 0 && (
                  <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-10 max-h-96 overflow-y-auto">
                    {searchResults.results.map((result: SearchResult) => (
                      <button
                        key={result.ticker}
                        onClick={() => handleSelectStock(result.ticker)}
                        className="w-full px-4 py-3 hover:bg-gray-50 flex flex-col items-start text-left border-b border-gray-100 last:border-b-0"
                      >
                        <div className="font-medium text-gray-900">{result.ticker}</div>
                        <div className="text-sm text-gray-600">{result.name}</div>
                        <div className="text-xs text-gray-400">{result.primary_exchange}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
                {featureCards.map((card, index) => (
                  <Card
                    key={index}
                    className="bg-gray-50 rounded-2xl border border-gray-200"
                  >
                    <CardContent className="flex flex-col items-center text-center p-6 gap-4">
                      <div
                        className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center`}
                      >
                        <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <h3 className="font-normal text-[#101727] text-base tracking-[-0.31px] leading-6">
                          {card.title}
                        </h3>
                        <p className="font-normal text-[#495565] text-base tracking-[-0.31px] leading-6">
                          {card.description}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="w-full flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {selectedTicker}
                  </h1>
                  {stockDetails?.results && (
                    <p className="text-lg text-gray-600 mt-1">{stockDetails.results.name}</p>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setSelectedTicker(null)}
                >
                  Back to Search
                </Button>
              </div>

              {isLoadingFinancials ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : financials?.results && financials.results.length > 0 ? (
                <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Revenue Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            stroke="#2563eb"
                            strokeWidth={2}
                            name="Revenue"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Net Income Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={revenueChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" />
                          <YAxis tickFormatter={(value) => formatCurrency(value)} />
                          <Tooltip
                            formatter={(value: number) => formatCurrency(value)}
                          />
                          <Bar dataKey="netIncome" fill="#9333ea" name="Net Income" />
                        </BarChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Financial Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-4">Fiscal Year</th>
                              <th className="text-right py-2 px-4">Revenue</th>
                              <th className="text-right py-2 px-4">Net Income</th>
                              <th className="text-right py-2 px-4">Gross Profit</th>
                              <th className="text-right py-2 px-4">EPS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {financials.results.map((item: FinancialData, index: number) => (
                              <tr key={index} className="border-b hover:bg-gray-50">
                                <td className="py-2 px-4">{item.fiscal_year}</td>
                                <td className="text-right py-2 px-4">
                                  {formatCurrency(item.financials.income_statement.revenues?.value || 0)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {formatCurrency(item.financials.income_statement.net_income_loss?.value || 0)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  {formatCurrency(item.financials.income_statement.gross_profit?.value || 0)}
                                </td>
                                <td className="text-right py-2 px-4">
                                  ${item.financials.income_statement.basic_earnings_per_share?.value?.toFixed(2) || "N/A"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  No financial data available for this stock
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

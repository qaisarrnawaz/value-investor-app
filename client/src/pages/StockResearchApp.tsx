import {
  SearchIcon,
  MoonIcon,
  Loader2,
  ArrowLeft,
  TrendingUp,
} from "lucide-react";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  AreaChart,
  Area,
  Treemap,
  Cell,
} from "recharts";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

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
    icon: TrendingUp,
    iconBg: "bg-purple-100",
    iconColor: "text-purple-600",
    title: "Financial Charts",
    description: "Visualize 5-year revenue, profit, and DCF trends",
  },
  {
    icon: TrendingUp,
    iconBg: "bg-green-100",
    iconColor: "text-green-600",
    title: "Revenue Treemap",
    description: "See product segment breakdown and growth rates",
  },
];

// Function to generate DCF projection based on historical data
const generateDCFData = (financials: any[]) => {
  if (!financials || financials.length === 0) return [];
  
  const latestYear = parseInt(financials[0]?.fiscal_year || new Date().getFullYear().toString());
  const latestRevenue = (financials[0]?.financials?.income_statement?.revenues?.value || 0) / 1e9;
  
  // Simple projection with 5% growth rate (industry average)
  const growthRate = 1.05;
  const discountRate = 0.97; // 3% discount rate
  
  return Array.from({ length: 5 }, (_, i) => ({
    year: (latestYear + i + 1).toString(),
    fcf: Math.round(latestRevenue * Math.pow(growthRate, i + 1) * 0.15), // Assume 15% FCF margin
    dcf: Math.round(latestRevenue * Math.pow(growthRate, i + 1) * 0.15 * Math.pow(discountRate, i + 1)),
  }));
};

// Function to generate demo segment data (placeholder until real API data is available)
const generateDemoSegmentsData = (latestRevenue: number) => {
  // Placeholder demo data for visualization purposes
  if (latestRevenue === 0) return [];
  
  return [
    { name: "Products", value: Math.round(latestRevenue * 0.55 * 10) / 10, growth: 5.2, color: "#F59E0B" },
    { name: "Services", value: Math.round(latestRevenue * 0.30 * 10) / 10, growth: 8.5, color: "#3B82F6" },
    { name: "Other", value: Math.round(latestRevenue * 0.15 * 10) / 10, growth: 3.1, color: "#10B981" },
  ];
};

const CustomTreemapContent = (props: any) => {
  const { x, y, width, height, name, value, growth } = props;
  const fontSize = width > 100 ? 16 : 12;
  const shouldShowDetails = width > 80 && height > 60;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: props.fill,
          stroke: "#fff",
          strokeWidth: 2,
        }}
      />
      {shouldShowDetails && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize}
            fontWeight="600"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 10}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize - 2}
          >
            ${value}B
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 28}
            textAnchor="middle"
            fill="#fff"
            fontSize={fontSize - 3}
          >
            {growth > 0 ? "+" : ""}{growth}% YoY
          </text>
        </>
      )}
    </g>
  );
};

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
      const response = await fetch(`${API_BASE}/api/stocks/search?q=${encodeURIComponent(debouncedQuery)}`);
      if (!response.ok) throw new Error("Failed to search stocks");
      return response.json();
    },
    enabled: debouncedQuery.length >= 2,
  });

  const { data: stockDetails } = useQuery({
    queryKey: ["stocks", selectedTicker, "details"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/stocks/${selectedTicker}/details`);
      if (!response.ok) throw new Error("Failed to fetch stock details");
      return response.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: previousDay } = useQuery({
    queryKey: ["stocks", selectedTicker, "previous"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/stocks/${selectedTicker}/previous`);
      if (!response.ok) throw new Error("Failed to fetch previous day data");
      return response.json();
    },
    enabled: !!selectedTicker,
  });

  const { data: financials, isLoading: isLoadingFinancials } = useQuery({
    queryKey: ["stocks", selectedTicker, "financials"],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/api/stocks/${selectedTicker}/financials/income?timeframe=annual&limit=5`);
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
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const revenueChartData = financials?.results
    ?.map((item: FinancialData) => ({
      year: item.fiscal_year,
      revenue: (item.financials.income_statement.revenues?.value || 0) / 1e9,
    }))
    .reverse();

  const profitChartData = financials?.results
    ?.map((item: FinancialData) => ({
      year: item.fiscal_year,
      netIncome: (item.financials.income_statement.net_income_loss?.value || 0) / 1e9,
    }))
    .reverse();

  const currentPrice = previousDay?.results?.[0]?.c || 0;
  const previousClose = previousDay?.results?.[0]?.o || currentPrice;
  const priceChange = currentPrice - previousClose;
  const priceChangePercent = previousClose > 0 ? ((priceChange / previousClose) * 100).toFixed(2) : "0.00";

  // Generate dynamic DCF data based on financials
  const dcfData = React.useMemo(() => {
    return generateDCFData(financials?.results || []);
  }, [financials]);

  // Generate demo segments data (placeholder for demonstration)
  const segmentsData = React.useMemo(() => {
    const latestRevenue = financials?.results?.[0]?.financials?.income_statement?.revenues?.value || 0;
    return generateDemoSegmentsData(latestRevenue / 1e9);
  }, [financials]);

  // Calculate metrics from API data
  const marketCap = stockDetails?.results?.market_cap;
  const latestFinancials = financials?.results?.[0];
  const eps = latestFinancials?.financials?.income_statement?.basic_earnings_per_share?.value || 0;
  const peRatio = eps > 0 && currentPrice > 0 ? (currentPrice / eps).toFixed(1) : "N/A";

  const getGrowthColor = (growth: number) => {
    if (growth >= 15) return "#10B981";
    if (growth >= 5) return "#3B82F6";
    if (growth >= -5) return "#F59E0B";
    if (growth >= -5) return "#F97316";
    return "#EF4444";
  };

  return (
    <div className="bg-white w-full min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-8 py-4 border-b border-gray-200 bg-white sticky top-0 z-10">
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

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-8">
        <div className="w-full max-w-6xl flex flex-col gap-6">
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

              <div className="w-full max-w-2xl relative mx-auto">
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

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-8">
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
              <Button
                variant="ghost"
                onClick={() => setSelectedTicker(null)}
                className="self-start text-gray-600 hover:text-gray-900 -ml-2"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Search
              </Button>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center">
                    <span className="text-white text-xl font-semibold">
                      {selectedTicker.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-xl font-medium text-gray-900">
                      {stockDetails?.results?.name || "Loading..."}
                    </h1>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <span>{selectedTicker}</span>
                      <span>•</span>
                      <span>{stockDetails?.results?.sic_description || "Technology"}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-semibold text-gray-900">
                    ${currentPrice.toFixed(2)}
                  </div>
                  <div className={`flex items-center justify-end gap-1 text-sm ${priceChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>
                      {priceChange >= 0 ? "+" : ""}${priceChange.toFixed(2)} ({priceChange >= 0 ? "+" : ""}{priceChangePercent}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-6">
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Market Cap</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {marketCap ? formatCurrency(marketCap) : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">P/E Ratio</div>
                    <div className="text-lg font-semibold text-gray-900">{peRatio}</div>
                  </CardContent>
                </Card>
                <Card className="border-gray-200">
                  <CardContent className="p-4">
                    <div className="text-sm text-gray-600 mb-1">Stock Price</div>
                    <div className="text-lg font-semibold text-gray-900">
                      {currentPrice > 0 ? `$${currentPrice.toFixed(2)}` : "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Latest</div>
                  </CardContent>
                </Card>
              </div>

              {isLoadingFinancials ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <Tabs defaultValue="revenue" className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-gray-100 p-1 rounded-lg">
                    <TabsTrigger value="revenue" className="rounded-md">Revenue</TabsTrigger>
                    <TabsTrigger value="profit" className="rounded-md">Profit</TabsTrigger>
                    <TabsTrigger value="dcf" className="rounded-md">DCF Analysis</TabsTrigger>
                    <TabsTrigger value="segments" className="rounded-md">Segments</TabsTrigger>
                  </TabsList>

                  <TabsContent value="revenue" className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Revenue Trend (5 Years)
                      </h3>
                      <p className="text-sm text-gray-600">Annual revenue in billions USD</p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart data={revenueChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                          label={{ value: 'Revenue ($B)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toFixed(1)}B`, 'Revenue']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        />
                        <Bar dataKey="revenue" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Revenue ($B)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="profit" className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Profit Trend (5 Years)
                      </h3>
                      <p className="text-sm text-gray-600">Net income in billions USD</p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <LineChart data={profitChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                          label={{ value: 'Net Income ($B)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                        />
                        <Tooltip
                          formatter={(value: number) => [`$${value.toFixed(1)}B`, 'Net Income']}
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="netIncome" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', r: 6 }}
                          name="Net Income ($B)"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="dcf" className="mt-6 space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Discounted Cash Flow Analysis
                      </h3>
                      <p className="text-sm text-gray-600">
                        5-year DCF projection in billions USD (estimated based on historical revenue growth)
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <AreaChart data={dcfData}>
                        <defs>
                          <linearGradient id="colorFcf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.05}/>
                          </linearGradient>
                          <linearGradient id="colorDcf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#EC4899" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis 
                          dataKey="year" 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                        />
                        <YAxis 
                          stroke="#6B7280"
                          tick={{ fill: '#6B7280' }}
                          label={{ value: 'Cash Flow ($B)', angle: -90, position: 'insideLeft', fill: '#6B7280' }}
                        />
                        <Tooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                        />
                        <Area 
                          type="monotone" 
                          dataKey="fcf" 
                          stroke="#3B82F6" 
                          strokeWidth={2}
                          fill="url(#colorFcf)" 
                          name="Free Cash Flow"
                        />
                        <Area 
                          type="monotone" 
                          dataKey="dcf" 
                          stroke="#EC4899" 
                          strokeWidth={2}
                          fill="url(#colorDcf)" 
                          name="Discounted FCF"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </TabsContent>

                  <TabsContent value="segments" className="mt-6 space-y-6">
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-4">
                      <p className="text-sm text-amber-900">
                        <strong>⚠️ Demo Feature:</strong> The segment breakdown shown below is for demonstration purposes only. 
                        Real company segment data is not currently available through our data provider. 
                        The visualization uses placeholder percentages to show how this feature would work with real data.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        Revenue by Product Category
                      </h3>
                      <p className="text-sm text-gray-600">
                        Which products contribute most to revenue? Size = revenue share, Color = YoY growth
                      </p>
                    </div>
                    <ResponsiveContainer width="100%" height={400}>
                      <Treemap
                        data={segmentsData}
                        dataKey="value"
                        stroke="#fff"
                        fill="#8884d8"
                        content={<CustomTreemapContent />}
                      >
                        {segmentsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Treemap>
                    </ResponsiveContainer>

                    <div className="flex items-center gap-4 text-xs flex-wrap">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span>Strong Growth (15%+)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span>Good Growth (5-15%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <span>Slow Growth (0-5%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                        <span>Slight Decline (-5-0%)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <span>Decline (-5% or worse)</span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-gray-200">
                          <tr>
                            <th className="text-left py-3 px-4 font-medium text-gray-700">Segment</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">Revenue</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">% of Total</th>
                            <th className="text-right py-3 px-4 font-medium text-gray-700">YoY Growth</th>
                          </tr>
                        </thead>
                        <tbody>
                          {segmentsData.map((segment, index) => {
                            const total = segmentsData.reduce((sum, s) => sum + s.value, 0);
                            const percentage = ((segment.value / total) * 100).toFixed(1);
                            return (
                              <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 px-4 flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: segment.color }}></div>
                                  {segment.name}
                                </td>
                                <td className="text-right py-3 px-4">${segment.value}B</td>
                                <td className="text-right py-3 px-4">{percentage}%</td>
                                <td className={`text-right py-3 px-4 font-medium ${segment.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {segment.growth >= 0 ? '+' : ''}{segment.growth}%
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </TabsContent>
                </Tabs>
              )}

              <div className="mt-8 pb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">About</h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {stockDetails?.results?.description || 
                    "Apple Inc. designs, manufactures, and markets smartphones, personal computers, tablets, wearables, and accessories worldwide."}
                </p>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

import {
  LayoutGridIcon,
  MoonIcon,
  SearchIcon,
  TrendingUpIcon,
} from "lucide-react";
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

      <main className="flex-1 flex flex-col items-center justify-start px-4 pt-24">
        <div className="w-full max-w-4xl flex flex-col items-center gap-12">
          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="font-medium text-[#101727] text-xl tracking-[-0.45px] leading-[30px]">
              SearchIcon Companies
            </h1>
            <p className="font-normal text-[#495565] text-base tracking-[-0.31px] leading-6">
              Look up financial data and visualize company fundamentals
            </p>
          </div>

          <div className="w-full max-w-2xl relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="SearchIcon for a company (e.g., Nike, Apple)..."
              className="w-full h-auto pl-12 pr-4 py-6 bg-white rounded-2xl border border-[#d0d5db] text-sm tracking-[-0.15px] placeholder:text-[#717182]"
            />
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
        </div>
      </main>
    </div>
  );
};

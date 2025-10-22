import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

const POLYGON_API_KEY = process.env.POLYGON_API_KEY;
const POLYGON_BASE_URL = "https://api.polygon.io";

export async function registerRoutes(app: Express): Promise<Server> {
  // Validate API key at startup
  if (!POLYGON_API_KEY) {
    throw new Error("POLYGON_API_KEY environment variable is required but not set");
  }

  const authHeaders = {
    Authorization: `Bearer ${POLYGON_API_KEY}`,
    "X-Polygon-API-Key": String(POLYGON_API_KEY),
  } as const;

  async function polygonFetch(pathWithQuery: string) {
    const url = `${POLYGON_BASE_URL}${pathWithQuery}`;
    const response = await fetch(url, { headers: authHeaders });
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Polygon API error: ${response.statusText}`);
    }
    return response;
  }

  // Search for companies by ticker or name
  app.get("/api/stocks/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }

      const response = await polygonFetch(
        `/v3/reference/tickers?search=${encodeURIComponent(query)}&active=true&limit=10`,
      );

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get company details
  app.get("/api/stocks/:ticker/details", async (req, res) => {
    try {
      const { ticker } = req.params;
      const encodedTicker = encodeURIComponent(ticker);

      const response = await polygonFetch(
        `/v3/reference/tickers/${encodedTicker}`,
      );

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get income statements (revenue, earnings, etc.)
  app.get("/api/stocks/:ticker/financials/income", async (req, res) => {
    try {
      const { ticker } = req.params;
      const encodedTicker = encodeURIComponent(ticker);
      const timeframe = req.query.timeframe || "annual";
      const limit = req.query.limit || 5;

      const response = await polygonFetch(
        `/vX/reference/financials?ticker=${encodedTicker}&timeframe=${timeframe}&limit=${limit}`,
      );

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get aggregated bars (price data for charts)
  app.get("/api/stocks/:ticker/aggregates", async (req, res) => {
    try {
      const { ticker } = req.params;
      const encodedTicker = encodeURIComponent(ticker);
      const { from, to, timespan = "day", multiplier = 1 } = req.query;

      if (!from || !to) {
        return res.status(400).json({ error: "from and to date parameters are required (YYYY-MM-DD)" });
      }

      const response = await polygonFetch(
        `/v2/aggs/ticker/${encodedTicker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc`,
      );

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Get previous day's data (quick snapshot)
  app.get("/api/stocks/:ticker/previous", async (req, res) => {
    try {
      const { ticker } = req.params;
      const encodedTicker = encodeURIComponent(ticker);

      const response = await polygonFetch(
        `/v2/aggs/ticker/${encodedTicker}/prev?adjusted=true`,
      );

      if (!response.ok) {
        throw new Error(`Polygon API error: ${response.statusText}`);
      }

      const data = await response.json();
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}

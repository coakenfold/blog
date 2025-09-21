import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { addToQueue, type AddToQueue } from "./addToQueue";
import { getAttributionData } from "./getAttributionData";
import { type WebVitalMetric } from "./types";

const originalConsoleLog = console.log;

// Mock the getAttributionData module
vi.mock("./getAttributionData", () => ({
  getAttributionData: vi.fn(),
}));

describe("addToQueue", () => {
  let mockFlushQueue: ReturnType<typeof vi.fn>;
  let mockQueue: { add: ReturnType<typeof vi.fn> };
  let mockMetric: WebVitalMetric;
  let mockFlushTimer: ReturnType<typeof setTimeout>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let clearTimeoutSpy: ReturnType<typeof vi.spyOn>;
  let setTimeoutSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();

    // Mock dependencies
    mockFlushQueue = vi.fn();
    mockQueue = { add: vi.fn() };
    mockMetric = {
      delta: 100,
      id: "test-metric-id",
      name: "CLS",
      navigationType: "navigate",
      rating: "good",
      value: 0.05,
      attribution: { element: "div" },
    } as unknown as WebVitalMetric;
    mockFlushTimer = 12345 as unknown as ReturnType<typeof setTimeout>;

    // Mock browser APIs
    Object.defineProperty(window, "location", {
      value: { hostname: "test.example.com" },
      writable: true,
    });

    // Mock console.log

    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    // Mock timer functions
    clearTimeoutSpy = vi.spyOn(global, "clearTimeout");
    setTimeoutSpy = vi.spyOn(global, "setTimeout");

    // Mock Date.now to return a consistent value
    vi.spyOn(Date, "now").mockReturnValue(1234567890);

    // Mock getAttributionData to return test data
    vi.mocked(getAttributionData).mockReturnValue({
      customAttribute: "test-value",
      metricSpecificData: "example",
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("development mode", () => {
    it("should log metric data to console when isDev is true", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: true,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(consoleLogSpy).toHaveBeenCalledWith("🔍 Web Vitals (DEV):", {
        name: mockMetric.name,
        value: mockMetric.value,
        rating: mockMetric.rating,
        attribution: mockMetric.attribution,
      });
    });

    it("should set flush timeout to 10 seconds in development", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: true,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(setTimeoutSpy).toHaveBeenCalledWith(mockFlushQueue, 10000);
    });
  });

  describe("production mode", () => {
    it("should not log metric data to console when isDev is false", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it("should set flush timeout to 30 seconds in production", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(setTimeoutSpy).toHaveBeenCalledWith(mockFlushQueue, 30000);
    });
  });

  describe("queue operations", () => {
    it("should add metric to queue with all standard properties", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith({
        // Standard metric properties
        delta: mockMetric.delta,
        id: mockMetric.id,
        name: mockMetric.name,
        navigationType: mockMetric.navigationType,
        rating: mockMetric.rating,
        value: mockMetric.value,

        // Environment context
        environment: "production",
        hostname: "test.example.com",

        // Timestamp
        timestamp: 1234567890,

        // Attribution data
        customAttribute: "test-value",
        metricSpecificData: "example",
      });
    });

    it("should add development environment when isDev is true", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: true,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          environment: "development",
        })
      );
    });

    it("should call getAttributionData with the metric", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(getAttributionData).toHaveBeenCalledWith({ metric: mockMetric });
    });

    it("should include attribution data in the queue item", () => {
      const attributionData = {
        customField: "custom-value",
        anotherField: 123,
      };
      vi.mocked(getAttributionData).mockReturnValue(attributionData);

      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining(attributionData)
      );
    });
  });

  describe("timer management", () => {
    it("should clear existing flush timer", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(clearTimeoutSpy).toHaveBeenCalledWith(mockFlushTimer);
    });

    it("should return new timeout ID", () => {
      const mockTimeoutId = 98765 as ReturnType<typeof setTimeout>;
      setTimeoutSpy.mockReturnValue(mockTimeoutId);

      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      const result = addToQueue(params);

      expect(result).toBe(mockTimeoutId);
    });

    it("should clear timeout before setting new one", () => {
      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      // Verify clearTimeout is called before setTimeout
      const clearTimeoutCall = clearTimeoutSpy.mock.invocationCallOrder[0];
      const setTimeoutCall = setTimeoutSpy.mock.invocationCallOrder[0];
      expect(clearTimeoutCall).toBeLessThan(setTimeoutCall);
    });
  });

  describe("edge cases", () => {
    it("should handle metric with minimal properties", () => {
      const minimalMetric = {
        delta: 0,
        id: "min-id",
        name: "LCP",
        navigationType: "reload",
        rating: "poor",
        value: 1000,
      } as WebVitalMetric;

      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: minimalMetric,
        queue: mockQueue,
      };

      expect(() => addToQueue(params)).not.toThrow();
      expect(mockQueue.add).toHaveBeenCalled();
    });

    it("should handle empty attribution data", () => {
      vi.mocked(getAttributionData).mockReturnValue({});

      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          delta: mockMetric.delta,
          id: mockMetric.id,
          name: mockMetric.name,
        })
      );
    });

    it("should handle different hostname values", () => {
      Object.defineProperty(window, "location", {
        value: { hostname: "different.domain.com" },
        writable: true,
      });

      const params: AddToQueue = {
        flushQueue: mockFlushQueue,
        flushTimer: mockFlushTimer,
        isDev: false,
        metric: mockMetric,
        queue: mockQueue,
      };

      addToQueue(params);

      expect(mockQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          hostname: "different.domain.com",
        })
      );
    });
  });
});

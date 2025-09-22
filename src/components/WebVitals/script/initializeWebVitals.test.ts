import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
// import { initializeWebVitals } from "./__test__/initializeWebVitals.BUG";
import { initializeWebVitals } from "./initializeWebVitals";
import type { WebVitalMetric } from "./types";

// Mock the web-vitals library
vi.mock("web-vitals/attribution", () => ({
  onCLS: vi.fn(),
  onINP: vi.fn(),
  onLCP: vi.fn(),
  onFCP: vi.fn(),
  onTTFB: vi.fn(),
}));

// Mock the utility functions
vi.mock("./addToQueue", () => ({
  addToQueue: vi.fn(),
}));

vi.mock("./flushQueue", () => ({
  flushQueue: vi.fn(),
}));

// Import mocked functions
import { onCLS, onINP, onLCP, onFCP, onTTFB } from "web-vitals/attribution";
import { addToQueue } from "./addToQueue";
import { flushQueue } from "./flushQueue";

// Mock global objects and functions
const mockAddEventListener = vi.fn();
const mockClearTimeout = vi.fn();
const mockSetTimeout = vi.fn();
const mockConsoleLog = vi.fn();

// Setup global mocks
beforeEach(() => {
  // Mock global functions
  global.addEventListener = mockAddEventListener;
  global.clearTimeout = mockClearTimeout;
  global.setTimeout = mockSetTimeout;

  // Mock console
  global.console = { ...console, log: mockConsoleLog };

  // Mock document
  Object.defineProperty(global, "document", {
    value: {
      visibilityState: "visible",
    },
    writable: true,
  });

  // Reset all mocks
  vi.clearAllMocks();

  // Setup setTimeout mock to return a timer ID
  mockSetTimeout.mockReturnValue(12345);
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("initializeWebVitals", () => {
  const defaultProps = {
    idGA4: "GA4-TEST-ID",
    isDev: false,
    queue: new Set(),
    shouldEnableAnalyticsBE: true,
    shouldEnableAnalyticsFE: true,
  };

  it("should initialize web vitals listeners", () => {
    initializeWebVitals(defaultProps);

    // Verify all web vitals listeners are set up
    expect(onCLS).toHaveBeenCalledWith(expect.any(Function), {
      reportAllChanges: true,
    });
    expect(onINP).toHaveBeenCalledWith(expect.any(Function), {
      reportAllChanges: true,
    });
    expect(onLCP).toHaveBeenCalledWith(expect.any(Function), {
      reportAllChanges: true,
    });
    expect(onFCP).toHaveBeenCalledWith(expect.any(Function));
    expect(onTTFB).toHaveBeenCalledWith(expect.any(Function));
  });

  it("should set up event listeners for page lifecycle events", () => {
    initializeWebVitals(defaultProps);

    const eventListenerCalls = mockAddEventListener.mock.calls;
    const eventTypes = eventListenerCalls.map((call) => call[0]);

    expect(eventTypes).toContain("visibilitychange");
    expect(eventTypes).toContain("beforeunload");
    expect(eventTypes).toContain("mousedown");
    expect(eventTypes).toContain("mousemove");
    expect(eventTypes).toContain("keypress");
    expect(eventTypes).toContain("scroll");
    expect(eventTypes).toContain("touchstart");
  });

  it("should call addToQueue when a metric is reported", () => {
    const mockMetric: WebVitalMetric = {
      name: "CLS",
      value: 0.1,
      delta: 0.1,
      id: "test-id",
      rating: "good",
      navigationType: "navigate",
    };

    initializeWebVitals(defaultProps);

    // Get the onReport callback from the first web vital listener
    const onReportCallback = (onCLS as any).mock.calls[0][0];

    // Simulate a metric being reported
    onReportCallback(mockMetric);

    expect(addToQueue).toHaveBeenCalledWith({
      metric: mockMetric,
      isDev: false,
      flushTimer: undefined,
      queue: defaultProps.queue,
      flushQueue: expect.any(Function),
    });
  });

  it("should update flush timer when addToQueue returns a new timer", () => {
    const mockTimer = 98765;
    (addToQueue as any).mockReturnValue(mockTimer);

    const mockMetric: WebVitalMetric = {
      name: "LCP",
      value: 1000,
      delta: 1000,
      id: "test-lcp-id",
      rating: "good",
      navigationType: "navigate",
    };

    initializeWebVitals(defaultProps);

    // Get the onReport callback
    const onReportCallback = (onCLS as any).mock.calls[0][0];
    onReportCallback(mockMetric);

    // Call it again to verify the timer is passed
    onReportCallback(mockMetric);

    expect(addToQueue).toHaveBeenLastCalledWith({
      metric: mockMetric,
      isDev: false,
      flushTimer: mockTimer,
      queue: defaultProps.queue,
      flushQueue: expect.any(Function),
    });
  });

  it("should flush queue when page becomes hidden", () => {
    initializeWebVitals(defaultProps);

    // Find the visibilitychange event listener
    const visibilityChangeCall = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "visibilitychange"
    );

    expect(visibilityChangeCall).toBeDefined();

    const visibilityChangeHandler = visibilityChangeCall[1];

    // Mock document.visibilityState as hidden
    Object.defineProperty(document, "visibilityState", {
      value: "hidden",
      writable: true,
    });

    // Trigger the event handler
    visibilityChangeHandler();

    expect(flushQueue).toHaveBeenCalledWith({
      flushTimer: undefined,
      idGA4: "GA4-TEST-ID",
      isDev: false,
      queue: defaultProps.queue,
      shouldEnableAnalyticsBE: true,
      shouldEnableAnalyticsFE: true,
    });
  });

  it("should not flush queue when page visibility changes but is not hidden", () => {
    initializeWebVitals(defaultProps);

    const visibilityChangeCall = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "visibilitychange"
    );

    const visibilityChangeHandler = visibilityChangeCall[1];

    // Keep document.visibilityState as visible
    Object.defineProperty(document, "visibilityState", {
      value: "visible",
      writable: true,
    });

    visibilityChangeHandler();

    expect(flushQueue).not.toHaveBeenCalled();
  });

  it("should flush queue on beforeunload", () => {
    initializeWebVitals(defaultProps);

    const beforeUnloadCall = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "beforeunload"
    );

    expect(beforeUnloadCall).toBeDefined();

    const beforeUnloadHandler = beforeUnloadCall[1];
    beforeUnloadHandler();

    expect(flushQueue).toHaveBeenCalledWith({
      flushTimer: undefined,
      idGA4: "GA4-TEST-ID",
      isDev: false,
      queue: defaultProps.queue,
      shouldEnableAnalyticsBE: true,
      shouldEnableAnalyticsFE: true,
    });
  });

  it("should set up idle timer with correct timeout for production", () => {
    initializeWebVitals({ ...defaultProps, isDev: false });

    expect(mockSetTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      60000 // 1 minute for production
    );
  });

  it("should set up idle timer with correct timeout for development", () => {
    initializeWebVitals({ ...defaultProps, isDev: true });

    expect(mockSetTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      30000 // 30 seconds for development
    );
  });

  it("should reset idle timer on user activity events", () => {
    initializeWebVitals(defaultProps);

    // Find one of the user activity event listeners
    const mousedownCall = mockAddEventListener.mock.calls.find(
      (call) => call[0] === "mousedown"
    );

    expect(mousedownCall).toBeDefined();
    expect(mousedownCall[2]).toEqual({ passive: true });

    const activityHandler = mousedownCall[1];

    // Clear the mock to focus on the reset behavior
    mockSetTimeout.mockClear();

    // Trigger the activity handler
    activityHandler();

    // Should clear the existing timer and set a new one
    expect(mockClearTimeout).toHaveBeenCalledWith(12345);
    expect(mockSetTimeout).toHaveBeenCalledWith(
      expect.any(Function),
      60000 // Production timeout
    );
  });

  it("should flush queue when idle timer expires and queue has items", () => {
    const queueWithItems = new Set([{ name: "test-metric" }]);

    initializeWebVitals({
      ...defaultProps,
      queue: queueWithItems,
      isDev: true,
    });

    // Get the idle timer callback
    const idleTimerCallback = mockSetTimeout.mock.calls[0][0];

    // Execute the idle timer callback
    idleTimerCallback();

    expect(flushQueue).toHaveBeenCalledWith({
      flushTimer: undefined,
      idGA4: "GA4-TEST-ID",
      isDev: true,
      queue: queueWithItems,
      shouldEnableAnalyticsBE: true,
      shouldEnableAnalyticsFE: true,
    });
  });

  it("should not flush queue when idle timer expires but queue is empty", () => {
    const emptyQueue = new Set();

    initializeWebVitals({
      ...defaultProps,
      queue: emptyQueue,
    });

    const idleTimerCallback = mockSetTimeout.mock.calls[0][0];
    idleTimerCallback();

    expect(flushQueue).not.toHaveBeenCalled();
  });

  it("should log initialization message in development mode", () => {
    initializeWebVitals({ ...defaultProps, isDev: true });

    // Trigger a metric report to execute the onReport function
    const onReportCallback = (onCLS as any).mock.calls[0][0];
    const mockMetric: WebVitalMetric = {
      name: "CLS",
      value: 0.1,
      delta: 0.1,
      id: "test-id",
      rating: "good",
      navigationType: "navigate",
    };

    onReportCallback(mockMetric);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "🚀 Web Vitals tracking initialized:",
      {
        environment: "development",
        idGA4: "GA4-TEST-ID",
        shouldEnableAnalyticsBE: true,
        shouldEnableAnalyticsFE: true,
      }
    );
  });

  it("should log idle flush message in development mode", () => {
    const queueWithItems = new Set([{ name: "test-metric" }]);

    initializeWebVitals({
      ...defaultProps,
      queue: queueWithItems,
      isDev: true,
    });

    const idleTimerCallback = mockSetTimeout.mock.calls[0][0];
    idleTimerCallback();

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "⏰ Flushing queue due to user inactivity"
    );
  });

  it("should not log messages in production mode", () => {
    const queueWithItems = new Set([{ name: "test-metric" }]);

    initializeWebVitals({
      ...defaultProps,
      queue: queueWithItems,
      isDev: false,
    });

    // Trigger idle flush
    const idleTimerCallback = mockSetTimeout.mock.calls[0][0];
    idleTimerCallback();

    expect(mockConsoleLog).not.toHaveBeenCalled();
  });

  it("should handle missing GA4 ID correctly", () => {
    initializeWebVitals({
      ...defaultProps,
      idGA4: "",
      isDev: true,
    });

    // Trigger a metric report to execute the onReport function
    const onReportCallback = (onCLS as any).mock.calls[0][0];
    const mockMetric: WebVitalMetric = {
      name: "CLS",
      value: 0.1,
      delta: 0.1,
      id: "test-id",
      rating: "good",
      navigationType: "navigate",
    };

    onReportCallback(mockMetric);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      "🚀 Web Vitals tracking initialized:",
      expect.objectContaining({
        idGA4: "none",
      })
    );
  });

  it("should pass correct parameters to flushQueue function returned by onReport", () => {
    initializeWebVitals(defaultProps);

    // Get the onReport callback
    const onReportCallback = (onCLS as any).mock.calls[0][0];

    // Get the flushQueue function passed to addToQueue
    const mockMetric: WebVitalMetric = {
      name: "CLS",
      value: 0.1,
      delta: 0.1,
      id: "test-id",
      rating: "good",
      navigationType: "navigate",
    };

    onReportCallback(mockMetric);

    const addToQueueCall = (addToQueue as any).mock.calls[0][0];
    const flushQueueFunction = addToQueueCall.flushQueue;

    // Execute the flush function
    flushQueueFunction();

    expect(flushQueue).toHaveBeenCalledWith({
      flushTimer: undefined,
      idGA4: "GA4-TEST-ID",
      isDev: false,
      queue: defaultProps.queue,
      shouldEnableAnalyticsBE: true,
      shouldEnableAnalyticsFE: true,
    });
  });
});

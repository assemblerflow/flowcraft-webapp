// File with the available reports contexts
import React from "react";

const ReportDataUpdateContext = React.createContext({});
const ReportHighlightsContext = React.createContext({});

// ReportDataUpdateProvider and Consumer
export const ReportDataUpdateProvider = ReportDataUpdateContext.Provider;
export const ReportDataUpdateConsumer = ReportDataUpdateContext.Consumer;

export const ReportHighlightsProvider = ReportHighlightsContext.Provider;
export const ReportHighlightsConsumer = ReportHighlightsContext.Consumer;
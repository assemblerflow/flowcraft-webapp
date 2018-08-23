// File with the available reports contexts
import React from "react";

const ReportDataContext = React.createContext({});
const ReportHighlightsContext = React.createContext({});
const ReportFilterContext = React.createContext({});

// ReportDataUpdateProvider and Consumer
export const ReportDataProvider = ReportDataContext.Provider;
export const ReportDataConsumer = ReportDataContext.Consumer;

export const ReportHighlightsProvider = ReportHighlightsContext.Provider;
export const ReportHighlightsConsumer = ReportHighlightsContext.Consumer;

export const ReportFilterProvider = ReportFilterContext.Provider;
export const ReportFilterConsumer = ReportFilterContext.Consumer;

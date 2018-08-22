// File with the available reports contexts
import React from "react";

const ReportDataUpdateContext = React.createContext({});

// ReportDataUpdateProvider and Consumer
export const ReportDataUpdateProvider = ReportDataUpdateContext.Provider;
export const ReportDataUpdateConsumer = ReportDataUpdateContext.Consumer;
// File with the available reports contexts
import React from "react";

const ReportDataContext = React.createContext({});
const ReportAppContext = React.createContext({});
const ReportBroadcastContext = React.createContext({});

// ReportDataUpdateProvider and Consumer
export const ReportDataProvider = ReportDataContext.Provider;
export const ReportDataConsumer = ReportDataContext.Consumer;

export const ReportAppProvider = ReportAppContext.Provider;
export const ReportAppConsumer = ReportAppContext.Consumer;

export const ReportBroadcastProvider = ReportBroadcastContext.Provider;
export const ReportBroadcastConsumer = ReportBroadcastContext.Consumer;


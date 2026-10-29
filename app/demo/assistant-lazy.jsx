"use client";

import dynamic from "next/dynamic";

// The assistant chat is only needed when someone opens it, so its code is downloaded
// AFTER the page is interactive instead of blocking every dashboard page.
const AssistantWidget = dynamic(() => import("./assistant-widget"), { ssr: false });

export default AssistantWidget;

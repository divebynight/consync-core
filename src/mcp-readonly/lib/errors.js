"use strict";

function sanitizeError(error) {
  const message = error && error.message ? String(error.message) : String(error);
  return message.replace(/\/Users\/[^/\s]+/g, "/Users/<user>");
}

function errorText(toolName, error) {
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            tool: toolName,
            error: true,
            message: sanitizeError(error),
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}

module.exports = { errorText, sanitizeError };

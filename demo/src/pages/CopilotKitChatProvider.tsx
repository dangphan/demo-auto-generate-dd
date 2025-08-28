import { CopilotKit } from "@copilotkit/react-core";
import { CopilotSidebar, type MessagesProps } from "@copilotkit/react-ui";
import interact from "interactjs";
import { useEffect, type ReactNode } from "react";
import { v4 as uuid } from "uuid";
import { Loader2 } from "lucide-react";
import { extractScheduleData, isValidJsonString } from "../utils/handleData";

function useDraggableCopilotButton() {
  useEffect(() => {
    let isDragging = false;
    let initialized = false;
    let attempts = 0;
    const maxAttempts = 120;

    const initializeDraggableButton = () => {
      const button = document.querySelector('button[aria-label="Open Chat"]');
      if (button instanceof HTMLElement && !initialized) {
        const parent = button.closest(".copilotKitSidebar");
        if (parent instanceof HTMLElement) {
          parent.style.position = "absolute";
          parent.style.right = "unset";
        }

        button.setAttribute("id", "copilot-draggable-button");
        button.style.position = "fixed";
        button.style.bottom = "1rem";
        button.style.right = "1rem";
        button.style.zIndex = "9999";

        button.addEventListener(
          "click",
          (e) => {
            if (isDragging) {
              e.preventDefault();
              e.stopPropagation();
            }
          },
          true
        );

        interact("#copilot-draggable-button").draggable({
          modifiers: [
            interact.modifiers.restrictRect({
              restriction: "body",
              endOnly: true,
            }),
          ],
          listeners: {
            start() {
              isDragging = true;
            },
            move(event) {
              const target = event.target as HTMLElement;
              const x =
                (parseFloat(target.getAttribute("data-x") || "0") || 0) +
                event.dx;
              const y =
                (parseFloat(target.getAttribute("data-y") || "0") || 0) +
                event.dy;

              target.style.transform = `translate(${x}px, ${y}px)`;
              target.setAttribute("data-x", x.toString());
              target.setAttribute("data-y", y.toString());
            },
            end() {
              setTimeout(() => {
                isDragging = false;
              }, 100);
            },
          },
        });

        initialized = true;
        observer.disconnect();
      } else if (!initialized && attempts < maxAttempts) {
        attempts++;
        requestAnimationFrame(initializeDraggableButton);
      }
    };

    const observer = new MutationObserver(() => {
      requestAnimationFrame(initializeDraggableButton);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    requestAnimationFrame(initializeDraggableButton);

    return () => observer.disconnect();
  }, []);
}

function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

function CustomMessages({
  messages,
  inProgress,
  RenderTextMessage,
  RenderActionExecutionMessage,
  RenderResultMessage,
}: MessagesProps) {
  const wrapperStyles = "p-4 flex flex-col gap-2 h-full overflow-y-auto";

  return (
    <div className={wrapperStyles}>
      {messages.map((message, index) => {
        if (message.isTextMessage()) {
          return (
            <div key={uuid()}>
              {/* {inProgress && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} */}
              {!isValidJson(message.content) ? (
                <RenderTextMessage
                  key={message.id}
                  message={message}
                  inProgress={inProgress}
                  index={index}
                  isCurrentMessage={index === messages.length - 1}
                />
              ) : (
                ""
              )}
            </div>
          );
        } else if (message.isActionExecutionMessage()) {
          return (
            <RenderActionExecutionMessage
              key={message.id}
              message={message}
              inProgress={inProgress}
              index={index}
              isCurrentMessage={index === messages.length - 1}
            />
          );
        } else if (message.isResultMessage()) {
          return (
            <RenderResultMessage
              key={message.id}
              message={message}
              inProgress={inProgress}
              index={index}
              isCurrentMessage={index === messages.length - 1}
            />
          );
        } else if (message.isAgentStateMessage()) {
          let list_report: any = [];
          let extractedData;

          // Enable print report
          const isShowReport =
            isValidJsonString(message.state?.processing?.report) &&
            JSON.parse(message.state?.processing?.report)?.stdout.length > 0;
          if (isShowReport) {
            JSON.parse(message?.state?.processing?.report)?.stdout.forEach(
              (line: string) => {
                const array = line.split("\n");
                if (array.length > 0) {
                  list_report.push(...array);
                } else {
                  list_report.push(line);
                }
              }
            );
            list_report = list_report.filter(
              (line: string) => line.trim() !== ""
            );
            extractedData = extractScheduleData(list_report);
          }
          const originalScheduleArray = extractedData?.originalSchedule || [];
          const agreementData = extractedData?.agreement || [];
          const requestSchedule = extractedData?.requestSchedule || [];
          //TODO: START
          // // Calculate adjustment data
          // const adjustmentData = [];
          // // Determine the length of the shortest array to avoid errors if lengths differ
          // const minLength = Math.min(
          //   originalScheduleArray.length,
          //   agreementData.length
          // );
          // for (let i = 0; i < minLength; i++) {
          //   adjustmentData.push(agreementData[i] - originalScheduleArray[i]);
          // }
          //TODO: END
          const finalAgreement = [];
          const minLength = Math.min(
            originalScheduleArray.length,
            agreementData.length
          );
          for (let i = 0; i < minLength; i++) {
            finalAgreement.push(agreementData[i] + originalScheduleArray[i]);
          }
          const isLoading = !message?.state?.processing?.completed;
          return (
            <div key={message.id} className="rounded-lg shadow ">
              {isLoading && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin m-4" />
              )}
              {/* {!isLoading &&
                isValidJsonString(message?.state?.processing?.report) && (
                  <p className="p-2">Done!</p>
                )}
              {isShowReport && (
                <div className="p-2">
                  <p>
                    <strong> Buyer Requested: </strong>
                    {requestSchedule.join(", ")}
                  </p>
                  <p>
                    <strong>Original Schedule: </strong>
                    {originalScheduleArray.join(", ")}
                  </p>
                  <p>
                    <strong>Adjustment: </strong>
                    {agreementData.join(", ")}
                  </p>
                  <p>
                    <strong>Final Agreement: </strong>
                    {finalAgreement.join(", ")}
                  </p>
                </div>
              )} */}
            </div>
          );
        }
      })}
    </div>
  );
}

const CopilotKitChatProvider = ({ children }: { children: ReactNode }) => {
  useDraggableCopilotButton();

  return (
    <CopilotKit
      agent="researchAgent"
      runtimeUrl={import.meta.env.VITE_APP_COPILOTKIT_API_URL}
      showDevConsole={false}
    >
      <CopilotSidebar
        defaultOpen={false}
        instructions={
          "You are assisting the user as best as you can. Answer in the best way possible given the data you have."
        }
        labels={{
          title: "Sidebar Assistant",
        }}
        Messages={CustomMessages}
      >
        {children}
      </CopilotSidebar>
    </CopilotKit>
  );
};

export default CopilotKitChatProvider;

import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
import { IconArrowLoopRight } from "@tabler/icons-react";
import LoaderIcon from "@/assets/icons/approval-queue/LoaderIcon.svg?react";
import CheckIcon from "@/assets/icons/approval-queue/CheckIcon.svg?react";
import DenyIcon from "@/assets/icons/approval-queue/DenyIcon.svg?react";
import type { NudgeRequest, DecisionStatus, ValidationResult, Meter } from "../../types";
import { StatusOverlay } from "./StatusOverlay";

const COLLAPSED_HEIGHT = 44;
const EXPANDED_PAD_Y = 24;
const PAD_X = 20;

interface Props {
  request: NudgeRequest;
  status: DecisionStatus;
  isLoading: boolean;
  isActive: boolean;
  meter?: Meter;
  onClick: () => void;
  onCollapseComplete: () => void;
  pendingValue?: number;
  onApprove: () => void;
  onDeny: () => void;
  onModify: (newValue: number) => ValidationResult;
  onPendingValueChange: (value: number) => void;
}

function fmt(value: number): string {
  return value.toFixed(2);
}

function valueFontPx(totalChars: number): number {
  if (totalChars <= 8) return 40;
  if (totalChars <= 10) return 32;
  return 26;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const openSpring = { type: "spring", duration: 0.6, bounce: 0 } as const;
const closeSpring = { type: "spring", duration: 0.5, bounce: 0 } as const;
const openEase = {
  duration: 0.7,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

function Skel({
  revealed,
  skeleton,
  children,
}: {
  revealed: boolean;
  skeleton: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className={`t-skel${revealed ? " is-revealed" : ""}`}>
      <div className="t-skel-skeleton is-pulsing">{skeleton}</div>
      <div className="t-skel-content">{children}</div>
    </div>
  );
}

export function QueueItemExpanded({
  request,
  status,
  isLoading,
  isActive,
  meter,
  onClick,
  onCollapseComplete,
  pendingValue,
  onApprove,
  onDeny,
  onModify,
  onPendingValueChange,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const [cardDone, setCardDone] = useState(false);
  const [showConstraint, setShowConstraint] = useState(false);
  const [constraintDone, setConstraintDone] = useState(false);
  const [isCollapsing, setIsCollapsing] = useState(false);
  const [isExpanding, setIsExpanding] = useState(false);
  const [pendingCollapse, setPendingCollapse] = useState(false);
  const [prevActive, setPrevActive] = useState(isActive);
  const initialNum = pendingValue ?? request.value;
  const [inputValue, setInputValue] = useState(
    initialNum !== undefined ? fmt(initialNum) : ""
  );
  const [validationError, setValidationError] = useState<string | null>(null);

  const cardDoneRef = useRef(false);
  const isCollapsingRef = useRef(false);
  const prevIsActiveRef = useRef(isActive);

  const isResolving = status === "resolving";
  const isSuccessApproved = status === "success-approved";
  const isSuccessDenied = status === "success-denied";
  const isSuccess = isSuccessApproved || isSuccessDenied;
  const isResolved = status === "approved" || status === "denied";

  const isIdleCollapsed = !isActive && !isCollapsing && !pendingCollapse;
  const showCollapsedOverlay = isCollapsing || isIdleCollapsed;
  const contentVisible = !isCollapsing && (isActive || pendingCollapse);

  function markCardDone() {
    if (cardDoneRef.current) return;
    cardDoneRef.current = true;
    setCardDone(true);
  }

  useEffect(() => {
    if (!isActive) return;
    const t = setTimeout(markCardDone, 200);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const v = pendingValue ?? request.value;
    setInputValue(v !== undefined ? fmt(v) : "");
    setValidationError(null);
    setEditMode(false);
  }, [request.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!cardDone || isLoading || !isActive) return;
    const t = setTimeout(() => setShowConstraint(true), 500);
    return () => clearTimeout(t);
  }, [cardDone, isLoading, isActive]);

  useEffect(() => {
    if (!isActive || isResolved || isResolving || isSuccess) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        setEditMode((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isActive, isResolved, isResolving, isSuccess]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isActive !== prevActive) {
    setPrevActive(isActive);
    if (isActive) {
      setIsExpanding(true);
      setIsCollapsing(false);
      isCollapsingRef.current = false;
      setPendingCollapse(false);
      setCardDone(false);
      cardDoneRef.current = false;
      setShowConstraint(true);
      setConstraintDone(true);
    } else {
      setPendingCollapse(true);
      const barWasShowing = constraintDone && !isExpanding && !!meter;
      if (!barWasShowing && !isCollapsingRef.current) {
        isCollapsingRef.current = true;
        setIsCollapsing(true);
      }
    }
  }

  useEffect(() => {
    const wasActive = prevIsActiveRef.current;
    prevIsActiveRef.current = isActive;
    if (isActive && !wasActive) {
      const t = setTimeout(() => {
        markCardDone();
        setIsExpanding(false);
      }, openEase.duration * 1000 + 100);
      return () => clearTimeout(t);
    }
  }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isCollapsing) return;
    const t = setTimeout(() => {
      setIsCollapsing(false);
      isCollapsingRef.current = false;
      setPendingCollapse(false);
      setIsExpanding(false);
      onCollapseComplete();
    }, closeSpring.duration * 1000 + 50);
    return () => clearTimeout(t);
  }, [isCollapsing]); // eslint-disable-line react-hooks/exhaustive-deps

  const displayValue = pendingValue ?? request.value;
  const revealed = !isLoading;
  const displayText = displayValue !== undefined ? fmt(displayValue) : "";

  const [prevEditMode, setPrevEditMode] = useState(editMode);
  if (editMode !== prevEditMode) {
    setPrevEditMode(editMode);
    if (editMode) {
      setInputValue(displayText);
      setValidationError(null);
    }
  }

  const parsedInput = parseFloat(inputValue);
  const valueChars =
    (request.valuePrefix?.length ?? 0) +
    (editMode
      ? Math.max(inputValue.length, isNaN(parsedInput) ? 0 : fmt(parsedInput).length)
      : displayText.length);
  const valueFontSize = valueFontPx(valueChars);

  function handleInputChange(raw: string) {
    if (raw !== "" && !/^-?\d*\.?\d*$/.test(raw)) return;
    setInputValue(raw);
    const num = parseFloat(raw);
    if (isNaN(num)) {
      setValidationError("Enter a valid number");
      return;
    }
    const result = onModify(num);
    if (!result.valid) {
      setValidationError(result.reason);
    } else {
      setValidationError(null);
      onPendingValueChange(num);
    }
  }

  function handleEditCommit() {
    if (!validationError) setEditMode(false);
  }

  const constraintSection = request.constraint && (
    <div
      data-nudge-section="value-constraint"
      className="flex flex-col mt-space-4"
      style={{ gap: "10px" }}
    >
      <div data-nudge-field="constraint" className="flex items-center justify-between pl-space-6">
        <div className="flex items-center gap-space-2">
          <IconArrowLoopRight size={14} className="text-text-muted" style={{ transform: "scaleY(-1)" }} />
          <span className="text-sm text-text-secondary">Policy</span>
        </div>
        <span
          data-nudge-field="constraint-label"
          className="text-xs font-normal text-status-warning tabular-nums"
        >
          {request.constraint.label}: {request.valuePrefix}{fmt(request.constraint.limit)}
        </span>
      </div>

      <div className="flex items-center justify-between pl-space-6">
        <div className="flex items-center gap-space-2">
          <IconArrowLoopRight size={14} className="text-text-muted" style={{ transform: "scaleY(-1)" }} />
          <span className="text-sm text-text-secondary">Payment rail</span>
        </div>
        <div className="flex items-center gap-space-2">
          <div
            style={{
              width: "18px",
              height: "11px",
              borderRadius: "1.48px",
              backgroundColor: "var(--color-text-muted)",
            }}
          />
          <span className="text-xs text-text-disabled tabular-nums">•• 4102</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col items-center w-fit">
      <motion.div
        style={{ width: "85%", overflow: "hidden" }}
        animate={{ height: (isCollapsing || !isActive || !constraintDone || isExpanding || !meter) ? 0 : "auto" }}
        transition={(isCollapsing || !isActive || !constraintDone || isExpanding) ? closeSpring : openSpring}
        onAnimationComplete={() => {
          if (!isActive && !isCollapsingRef.current) {
            isCollapsingRef.current = true;
            setIsCollapsing(true);
          }
        }}
      >
        {meter && (() => {
          const fillPct = Math.min(meter.value / meter.limit, 1) * 100;
          const emptyPct = 100 - fillPct;
          const prefix = meter.prefix ?? "";
          const label = `${prefix}${fmt(meter.value)}/${fmt(meter.limit)}`;
          return (
            <motion.div
              className="bg-surface-app"
              style={{ borderRadius: "12px 12px 0 0", padding: "8px", marginBottom: "-0.5px" }}
              initial={{ y: "100%" }}
              animate={{ y: (pendingCollapse || (constraintDone && isActive && !isExpanding)) ? 0 : "100%" }}
              transition={
                (constraintDone && isActive && !isExpanding && !pendingCollapse)
                  ? { type: "spring", duration: 0.8, bounce: 0.15 }
                  : { type: "spring", duration: 0.35, bounce: 0 }
              }
            >
              <div
                className="relative bg-surface-panel flex items-center px-space-3"
                style={{ borderRadius: "6px", height: "18px" }}
              >
                <div className="absolute inset-y-0 left-0 bg-accent-500" style={{ width: `${fillPct}%`, borderRadius: "6px" }} />
                <span className="relative ml-auto text-[10px] font-medium tabular-nums text-text-muted leading-none pointer-events-none">
                  {prefix}<span className="text-text-secondary">{fmt(meter.value)}</span>/{fmt(meter.limit)}
                </span>
                <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ right: `${emptyPct}%` }}>
                  <div className="absolute inset-0 flex items-center px-space-3" style={{ width: `${(100 / fillPct) * 100}%` }}>
                    <span className="ml-auto text-[10px] font-medium tabular-nums leading-none" style={{ color: "white" }}>
                      {label}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })()}
      </motion.div>

      <motion.div
        data-nudge-item={isIdleCollapsed ? "collapsed" : "expanded"}
        data-status={status}
        className="relative bg-surface-app w-[300px]"
        style={{
          border: "0.5px solid var(--color-border-subtle)",
          overflow: "hidden",
          cursor: isIdleCollapsed ? "pointer" : "default",
          paddingLeft: PAD_X,
          paddingRight: PAD_X,
        }}
        initial={{
          height: COLLAPSED_HEIGHT,
          borderRadius: 12,
        }}
        animate={{
          height: (isCollapsing || isIdleCollapsed) ? COLLAPSED_HEIGHT : "auto",
          borderRadius: (isCollapsing || isIdleCollapsed) ? 12 : 16,
        }}
        transition={(isCollapsing || isIdleCollapsed) ? closeSpring : openEase}
        onClick={isIdleCollapsed ? onClick : undefined}
        onAnimationComplete={() => {
          if (!isCollapsingRef.current) {
            markCardDone();
            setIsExpanding(false);
          }
        }}
      >
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingLeft: PAD_X,
            paddingRight: PAD_X,
            pointerEvents: "none",
          }}
          animate={{ opacity: showCollapsedOverlay ? 1 : 0 }}
          transition={
            showCollapsedOverlay
              ? { duration: 0.25, delay: 0.15, ease: "easeOut" }
              : { duration: 0.1, ease: "easeIn" }
          }
        >
          <span className="text-base font-normal text-text-primary shrink-0">{request.requester}</span>
          <span className="text-base font-medium text-text-muted truncate ml-3 text-right">
            {displayValue !== undefined
              ? `${request.valuePrefix ?? ""}${fmt(displayValue)}`
              : request.summary}
          </span>
        </motion.div>

        <motion.div
          style={{
            pointerEvents: contentVisible ? "auto" : "none",
            paddingTop: EXPANDED_PAD_Y,
            paddingBottom: EXPANDED_PAD_Y,
          }}
          animate={{ opacity: contentVisible ? 1 : 0 }}
          transition={{ duration: isCollapsing ? 0.08 : 0 }}
        >
          <div data-nudge-section="header" className="flex flex-col gap-space-1">
            <Skel
              revealed={revealed}
              skeleton={<div className="skel-bar" style={{ width: "75px", height: "16px" }} />}
            >
              <span data-nudge-field="requester" className="text-base font-normal text-text-primary">
                {request.requester}
              </span>
            </Skel>

            <Skel
              revealed={revealed}
              skeleton={<div className="skel-bar" style={{ width: "110px", height: "10px" }} />}
            >
              <span data-nudge-field="requested-at" className="text-[10px] text-text-secondary">
                Requested {relativeTime(request.requestedAt)}
              </span>
            </Skel>
          </div>

          {displayValue !== undefined && (
            <div className="mt-space-6">
              <Skel
                revealed={revealed}
                skeleton={
                  <div className="flex items-center gap-space-4">
                    <div className="skel-bar" style={{ width: "130px", height: "40px", borderRadius: "6px" }} />
                    <div className="skel-bar" style={{ width: "90px", height: "16px" }} />
                  </div>
                }
              >
                <div className="flex flex-wrap items-center gap-space-4">
                  <div className="flex items-center">
                    <span
                      className="font-medium text-text-primary leading-none tabular-nums"
                      style={{ fontSize: valueFontSize }}
                    >
                      {request.valuePrefix}
                    </span>
                    {editMode ? (
                      <span
                        className="font-medium text-text-primary leading-none tabular-nums"
                        style={{ display: "inline-grid", fontSize: valueFontSize, marginRight: -1 }}
                      >
                        <span
                          aria-hidden
                          style={{
                            gridArea: "1 / 1",
                            visibility: "hidden",
                            whiteSpace: "pre",
                            paddingRight: "1px",
                          }}
                        >
                          {inputValue || "0"}
                        </span>
                        <input
                          autoFocus
                          type="text"
                          size={1}
                          inputMode="decimal"
                          value={inputValue}
                          onChange={(e) => handleInputChange(e.target.value)}
                          onBlur={handleEditCommit}
                          onKeyDown={(e) => e.key === "Enter" && handleEditCommit()}
                          data-nudge-field="value"
                          style={{
                            gridArea: "1 / 1",
                            width: "100%",
                            minWidth: 0,
                            font: "inherit",
                            color: "inherit",
                            background: "none",
                            border: "none",
                            outline: "none",
                            padding: 0,
                            caretColor: "var(--color-accent-500)",
                          }}
                        />
                      </span>
                    ) : (
                      <span
                        data-nudge-field="value"
                        className="font-medium text-text-primary leading-none tabular-nums"
                        style={{ fontSize: valueFontSize, cursor: isResolved ? "default" : "text" }}
                        onClick={() => { if (!isResolved) setEditMode(true); }}
                      >
                        {displayText}
                      </span>
                    )}
                  </div>
                  <span data-nudge-field="summary" className="text-base font-medium text-text-secondary">
                    {request.summary}
                  </span>
                </div>
                {validationError && (
                  <p data-nudge-field="validation-error" className="mt-space-2 text-xs text-status-danger">
                    {validationError}
                  </p>
                )}
              </Skel>
            </div>
          )}

          {request.detail && (
            <div className="mt-space-5">
              <Skel
                revealed={revealed}
                skeleton={<div className="skel-bar" style={{ width: "100%", height: "14px" }} />}
              >
                <p data-nudge-field="detail" className="text-sm font-normal text-text-secondary">
                  {request.detail}
                </p>
              </Skel>
            </div>
          )}

          {constraintSection && (constraintDone ? (
            constraintSection
          ) : (
            <motion.div
              key="constraint"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: showConstraint ? "auto" : 0, opacity: showConstraint ? 1 : 0 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              style={{ overflow: "hidden" }}
              onAnimationComplete={() => showConstraint && setConstraintDone(true)}
            >
              {constraintSection}
            </motion.div>
          ))}

          {!isResolved && !isResolving && !isSuccess && (
            <div data-nudge-section="actions" className="mt-space-8 flex items-center gap-space-3">
              {[
                { action: "approve", label: "Approve", kbd: "A", onClick: onApprove },
                { action: "modify",  label: "Modify",  kbd: "M", onClick: () => setEditMode(v => !v) },
                { action: "deny",    label: "Deny",    kbd: "D", onClick: onDeny },
              ].map(({ action, label, kbd, onClick: onBtnClick }) => (
                <motion.button
                  key={action}
                  data-nudge-action={action}
                  onClick={onBtnClick}
                  className="flex items-center bg-surface-panel rounded-md cursor-pointer select-none"
                  style={{
                    gap: "6px",
                    padding: "4px 6px",
                    border: "0.5px solid var(--color-border-subtle)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  transition={{ type: "spring", duration: 0.15, bounce: 0 }}
                >
                  <span className="text-[12px] font-normal text-text-primary">{label}</span>
                  <kbd
                    className="flex items-center justify-center bg-surface-hover rounded-xs"
                    style={{
                      width: "14px",
                      height: "14px",
                      fontSize: "10px",
                      fontWeight: 400,
                      color: "var(--color-text-primary)",
                      fontFamily: "inherit",
                    }}
                  >
                    {kbd}
                  </kbd>
                </motion.button>
              ))}
            </div>
          )}

          {(isResolving || isSuccess) && (
            <motion.div
              data-nudge-section="resolving"
              className="mt-space-8 flex justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.15 }}
            >
              <div className="t-icon-swap" data-state={isResolving ? "a" : "b"}>
                <span className="t-icon" data-icon="a">
                  <LoaderIcon
                    role="status"
                    aria-label="Loading"
                    className="animate-spin"
                    width={20}
                    height={20}
                    style={{ color: "var(--color-text-muted)" }}
                  />
                </span>
                <span className="t-icon" data-icon="b">
                  {isSuccessApproved ? (
                    <CheckIcon
                      width={20}
                      height={20}
                      style={{ color: "var(--color-green-500)" }}
                    />
                  ) : (
                    <DenyIcon
                      width={20}
                      height={20}
                      style={{ color: "var(--color-red-500)" }}
                    />
                  )}
                </span>
              </div>
            </motion.div>
          )}

          {isResolved && <StatusOverlay status={status} />}
        </motion.div>
      </motion.div>
    </div>
  );
}

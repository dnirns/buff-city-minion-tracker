"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./DiceRoller.module.css";

interface DiceStep {
  label: string;
  sides: number;
  finalValue: number;
  resultText: string;
}

interface DiceRollerProps {
  steps: DiceStep[];
  onComplete: () => void;
}

const ROLL_DURATION = 1000;
const PAUSE_BETWEEN = 600;

function AnimatedDie({
  sides,
  finalValue,
  onLanded,
}: {
  sides: number;
  finalValue: number;
  onLanded: () => void;
}) {
  const [display, setDisplay] = useState(1);
  const [landed, setLanded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setDisplay(Math.floor(Math.random() * sides) + 1);
    }, 60);

    const timer = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setDisplay(finalValue);
      setLanded(true);
      onLanded();
    }, ROLL_DURATION);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      clearTimeout(timer);
    };
  }, [sides, finalValue, onLanded]);

  const className = [
    styles.die,
    landed ? styles.landed : styles.rolling,
  ].join(" ");

  return (
    <div className={className}>
      {display}
    </div>
  );
}

export default function DiceRoller({ steps, onComplete }: DiceRollerProps) {
  const [activeStep, setActiveStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const handleLanded = (stepIndex: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      next.add(stepIndex);
      return next;
    });

    if (stepIndex < steps.length - 1) {
      setTimeout(() => {
        setActiveStep(stepIndex + 1);
      }, PAUSE_BETWEEN);
    } else {
      setTimeout(() => {
        onCompleteRef.current();
      }, PAUSE_BETWEEN + 400);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.sequence}>
        {steps.slice(0, activeStep + 1).map((step, i) => (
          <div
            key={i}
            className={styles.rollGroup}
            style={{ animationDelay: `${i === activeStep ? 0 : 0}ms` }}
          >
            <span className={styles.rollLabel}>{step.label}</span>
            {i === activeStep && !completedSteps.has(i) ? (
              <AnimatedDie
                sides={step.sides}
                finalValue={step.finalValue}
                onLanded={() => handleLanded(i)}
              />
            ) : (
              <div className={`${styles.die} ${styles.landed}`}>
                {step.finalValue}
              </div>
            )}
            <span className={styles.dieType}>D{step.sides}</span>
            {completedSteps.has(i) && (
              <span className={styles.rollResult}>{step.resultText}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export type { DiceStep };

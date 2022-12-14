import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import "./App.css";

inspect({
  url: "https://statecharts.io/inspect",
  iframe: false,
});

const FIRST_QUESTIONS = {
  HOW_IT_WORKS_FIRST: "HOW_IT_WORKS_FIRST",
  PROTECTIONS_FIRST: "PROTECTIONS_FIRST",
  GOALS_FIRST: "GOALS_FIRST",
  INTENT_FIRST: "INTENT_FIRST",
};

const questionMachine = createMachine(
  {
    id: "question",
    initial: "start",
    context: {
      firstQuestions: FIRST_QUESTIONS.PROTECTIONS_FIRST,
    },
    states: {
      start: {
        on: {
          next: [
            {
              target: "howItWorks",
              cond: "howItWorksFirst",
            },
            {
              target: "protections",
              cond: "protectionsFirst",
            },
            {
              target: "goals",
              cond: "goalsFirst",
            },
            {
              target: "intent",
              cond: "intentFirst",
            },
          ],
        },
      },
      howItWorks: {
        on: {
          next: [
            {
              target: "protections",
              cond: "howItWorksFirst",
            },
            {
              target: "intent",
              cond: "protectionsFirst",
            },
            {
              target: "intent",
              cond: "goalsFirst",
            },
            {
              target: "goals",
              cond: "intentFirst",
            },
          ],
          prev: "start",
        },
      },
      goals: {
        on: {
          next: [
            {
              target: "howItWorks",
              cond: "protectionsFirst",
            },
            {
              target: "protections",
              cond: "goalsFirst",
            },
            {
              target: "protections",
              cond: "intentFirst",
            },
          ],
        },
      },
      protections: {
        on: {
          next: [
            { target: "intent", cond: "howItWorksFirst" },
            { target: "goals", cond: "protectionsFirst" },
            { target: "howItWorks", cond: "goalsFirst" },
          ],
          prev: "howItWorks",
        },
      },
      intent: {
        on: {
          next: [
            {
              target: "howItWorks",
              cond: "intentFirst",
            },
            {
              target: "gender",
            },
          ],
          prev: "protections",
        },
      },
      gender: {
        on: { next: "birthdate", prev: "intent" },
      },
      birthdate: {
        on: { next: "health", prev: "gender" },
      },
      health: {
        on: { next: "nicotine", prev: "birthdate" },
      },
      nicotine: {
        on: { next: "children", prev: "health" },
      },
      children: {
        on: { next: "wills", prev: "nicotine" },
      },
      wills: {
        on: { next: "income", prev: "children" },
      },
      income: {
        on: { next: "debt", prev: "wills" },
      },
      debt: {
        on: { next: "recommendation", prev: "income" },
      },
      recommendation: {
        on: { next: "confirmEligibility", prev: "debt" },
      },
      confirmEligibility: {
        on: { next: "birthCountry", prev: "recommendation" },
      },
      birthCountry: {
        on: {
          next: [
            { target: "citizen", cond: "skipBirthState" },
            { target: "birthState" },
          ],
          prev: "confirmEligibility",
        },
      },
      birthState: {
        on: { next: "citizen", prev: "birthCountry" },
      },
      citizen: {
        on: { next: "primaryAddress", prev: "birthState" },
      },
      primaryAddress: {
        on: { next: "phone", prev: "citizen" },
      },
      phone: {
        on: { next: "name", prev: "primaryAddress" },
      },
      name: {
        on: { next: "email", prev: "phone" },
      },
      email: {
        on: { next: "ssn", prev: "name" },
      },
      ssn: {
        type: "final",
      },
    },
  },
  {
    guards: {
      howItWorksFirst: (context) => {
        return context.firstQuestions === FIRST_QUESTIONS.HOW_IT_WORKS_FIRST;
      },
      protectionsFirst: (context) => {
        return context.firstQuestions === FIRST_QUESTIONS.PROTECTIONS_FIRST;
      },
      goalsFirst: (context) => {
        return context.firstQuestions === FIRST_QUESTIONS.GOALS_FIRST;
      },
      intentFirst: (context) => {
        return context.firstQuestions === FIRST_QUESTIONS.INTENT_FIRST;
      },
      skipBirthState: (context, event) => {
        return event.country !== "USA";
      },
    },
  }
);

export default function App() {
  const [state, send] = useMachine(questionMachine, { devTools: true });
  console.log({ state });

  if (state.done) {
    return <h1>Final Question: {state.value}</h1>;
  }

  return (
    <div className="App">
      <h1>Question: {state.value}</h1>
      {state.value !== "start" ? (
        <button onClick={() => send("prev")}>Prev</button>
      ) : null}
      <button onClick={() => send("next")}>Next</button>
    </div>
  );
}

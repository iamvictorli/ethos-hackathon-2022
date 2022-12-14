import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { ActionGroup, Item } from "@adobe/react-spectrum";
import "./App.css";
import React from "react";

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
    initial: "email",
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
              actions: ["saveHowItWorks"],
            },
            {
              target: "intent",
              cond: "protectionsFirst",
              actions: ["saveHowItWorks"],
            },
            {
              target: "intent",
              cond: "goalsFirst",
              actions: ["saveHowItWorks"],
            },
            {
              target: "goals",
              cond: "intentFirst",
              actions: ["saveHowItWorks"],
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
              actions: ["saveGoals"],
            },
            {
              target: "protections",
              cond: "goalsFirst",
              actions: ["saveGoals"],
            },
            {
              target: "protections",
              cond: "intentFirst",
              actions: ["saveGoals"],
            },
          ],
          prev: {
            target: "howItWorks",
          },
        },
      },
      protections: {
        on: {
          next: [
            {
              target: "intent",
              cond: "howItWorksFirst",
              actions: ["saveProtections"],
            },
            {
              target: "goals",
              cond: "protectionsFirst",
              actions: ["saveProtections"],
            },
            {
              target: "howItWorks",
              cond: "goalsFirst",
              actions: ["saveProtections"],
            },
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
        return event.birthCountry !== "United States";
      },
    },
    actions: {
      saveProtections: assign((context, event) => {
        return {
          protections: event.protections,
        };
      }),
      saveGoals: assign((context, event) => {
        return {
          goals: event.goals,
        };
      }),
      saveHowItWorks: assign((context, event) => {
        return {
          howItWorks: true,
        };
      }),
    },
  }
);

function Question({ name, send, context }) {
  let [protectionsSelected, protectionsSetSelected] = React.useState(
    new Set([])
  );
  let [goalsSelected, goalsSetSelected] = React.useState(new Set([]));
  let [birthCountry, setBirthCountry] = React.useState();

  if (name === "protections") {
    return (
      <>
        <h1>Question: {name}</h1>
        <ActionGroup
          selectionMode="multiple"
          selectedKeys={protectionsSelected}
          onSelectionChange={protectionsSetSelected}
        >
          <Item key="spouse">Spouse</Item>
          <Item key="children">Children</Item>
          <Item key="fiance">Fiance</Item>
          <Item key="partner">Partner</Item>
        </ActionGroup>
        {context.firstQuestions === FIRST_QUESTIONS.PROTECTIONS_FIRST ? null : (
          <button onClick={() => send("prev")}>Prev</button>
        )}
        <button
          onClick={() =>
            send({ type: "next", protections: Array.from(protectionsSelected) })
          }
        >
          Next
        </button>
      </>
    );
  } else if (name === "goals") {
    return (
      <>
        <h1>Question: {name}</h1>
        <ActionGroup
          selectionMode="multiple"
          selectedKeys={goalsSelected}
          onSelectionChange={goalsSetSelected}
        >
          <Item key="retirement">Retirement</Item>
          <Item key="mortgage">Mortgage</Item>
          <Item key="unsure">Unsure</Item>
        </ActionGroup>
        {context.firstQuestions === FIRST_QUESTIONS.GOALS_FIRST ? null : (
          <button onClick={() => send("prev")}>Prev</button>
        )}
        <button
          onClick={() =>
            send({ type: "next", goals: Array.from(goalsSelected) })
          }
        >
          Next
        </button>
      </>
    );
  } else if (name === "birthCountry") {
    return (
      <>
        <h1>Question: {name}</h1>
        <ActionGroup selectionMode="single" onAction={setBirthCountry}>
          <Item key="United States">United States</Item>
          <Item key="Other">Other</Item>
        </ActionGroup>
        <button onClick={() => send("prev")}>Prev</button>
        <button onClick={() => send({ type: "next", birthCountry })}>
          Next
        </button>
      </>
    );
  }

  // skip questions

  return (
    <>
      <h1>New Question: {name}</h1>
      <button onClick={() => send("prev")}>Prev</button>
      <button onClick={() => send("next")}>Next</button>
    </>
  );
}

export default function App() {
  const [state, send] = useMachine(questionMachine, { devTools: true });
  console.log({ state });

  if (state.value === "start") {
    send("next");
    return null;
  }

  if (state.done) {
    return <h1>Final Question: {state.value}</h1>;
  }

  return (
    <div className="App">
      <Question name={state.value} send={send} context={state.context} />
    </div>
  );
}

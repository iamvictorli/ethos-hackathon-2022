import { createMachine, assign } from "xstate";
import { useMachine } from "@xstate/react";
import { inspect } from "@xstate/inspect";
import { ActionGroup, Item, TextField } from "@adobe/react-spectrum";
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
        on: {
          next: [{ target: "accountCreate", actions: ["saveEmail"] }],
          prev: "name",
        },
      },
      accountCreate: {
        invoke: {
          id: "accountCreate",
          src: "createAccount",
          onDone: {
            target: "ssn",
            actions: "accountCreateOnDone",
          },
        },
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
      saveEmail: assign((context, event) => {
        return {
          email: event.email,
        };
      }),
      accountCreateOnDone: assign((context, event) => {
        console.log("account on done");

        console.log({ event });

        return {
          user: event.data.user,
          identity: event.data.identity,
          policy: event.data.policy,
        };
      }),
    },
    services: {
      createAccount: (context, event) => {
        const body = {
          userIdentityEmailData: {
            nameFirst: "TRLTestCase",
            nameMiddle: "Z",
            nameLast: "One",
            birthDate: "1990-09-09",
            gender: "Female",
            email: event.email,
            recaptcha: null,
            birthState: "AK",
            birthCountry: "USA",
            partnerCode: null,
          },
          addressData: {
            street1: "4624 South Pacific Highway",
            region: "OR",
            locality: "Phoenix",
            postalCode: "97535",
            type: "primary",
          },
          phoneNumberData: { number: "(823) 940-8239", type: "primary" },
          root: "http://localhost:9002",
          createAccountOnly: true,
          agentAssistedApplication: false,
        };

        return fetch("http://localhost:8000/v2.0/create-account", {
          headers: {
            accept: "application/json",
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          method: "PUT",
          credentials: "include",
        })
          .then(async (res) => {
            const json = await res.json();

            return { xcsrftoken: res.headers.get("X-CSRF-TOKEN"), json };
          })
          .then(async ({ json, xcsrftoken }) => {
            const policyJson = await fetch(
              `http://localhost:8000/v2.0/user/${json.user.id}/identity/${json.identity.id}/term-policy`,
              {
                headers: {
                  accept: "application/json",
                  "content-type": "application/json",
                  "X-XSRF-TOKEN": xcsrftoken,
                },
                body: '{"optionalData":{"profileData":{"statusCitizen":true,"statusPermanentResident":false,"prescreen":{"declaredTobacco":false,"declaredHealth":"3"},"occupationalHistory":{"grossAnnualIncome":"0"}},"quoteData":{}},"paymentPlan":"monthly","clientData":{"activeInUi":true,"attributionData":{},"intent":"veryLow","intentAnswer":"I\'m not sure","flow":"nap-recommendation","partnerCode":"","createdByPartner":false,"telesales":0,"progress":"preinterview","partnershipAttributes":{},"children":"0","mortgageDebtAmounts":"0","iulCandidate":false},"carrier":"LGA","purposeOfInsurance":"personal","applicationSource":null}',
                method: "PUT",
                credentials: "include",
              }
            );

            const policy = await policyJson.json();

            return new Promise((res) => {
              res({
                user: json.user,
                identity: json.identity,
                policy,
              });
            });
          });
      },
    },
  }
);

function Question({ name, send, context }) {
  let [protectionsSelected, protectionsSetSelected] = React.useState(
    new Set([])
  );
  let [goalsSelected, goalsSetSelected] = React.useState(new Set([]));
  let [birthCountry, setBirthCountry] = React.useState();
  let [email, setEmail] = React.useState("");

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
  } else if (name === "email" || name === "accountCreate") {
    return (
      <>
        <h1>Question: {name}</h1>
        <div>
          <TextField
            label="email"
            value={email}
            onChange={setEmail}
            isDisabled={name === "accountCreate"}
          />
        </div>
        <button
          onClick={() => send("prev")}
          disabled={name === "accountCreate"}
        >
          Prev
        </button>
        <button
          onClick={() => send({ type: "next", email })}
          disabled={name === "accountCreate"}
        >
          Next
        </button>
      </>
    );
  }

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
    return (
      <>
        <h1>Final Question: {state.value}</h1>
        <h2>{JSON.stringify({ policy: state.context.policy }, null, 2)}</h2>
      </>
    );
  }

  return (
    <div className="App">
      <Question name={state.value} send={send} context={state.context} />
    </div>
  );
}

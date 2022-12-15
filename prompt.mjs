import prompts from "prompts";
import { createMachine, assign, interpret } from "xstate";
import fetch from "node-fetch";
import cookie from "cookie";

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
    predictableActionArguments: true,
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
            const cookieHeader = res.headers.get("set-cookie");
            const cookieParsed = cookie.parse(cookieHeader);

            return {
              xcsrftoken: res.headers.get("X-CSRF-TOKEN"),
              json,
              jwt: cookieParsed.ETHOS,
            };
          })
          .then(async ({ json, xcsrftoken, jwt }) => {
            const policyJson = await fetch(
              `http://localhost:8000/v2.0/user/${json.user.id}/identity/${json.identity.id}/term-policy`,
              {
                headers: {
                  accept: "application/json",
                  "content-type": "application/json",
                  "X-XSRF-TOKEN": xcsrftoken,
                  cookie: `XSRF-TOKEN=${xcsrftoken}; ETHOS=${jwt}`,
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

(async () => {
  const service = interpret(questionMachine).onTransition(async (state) => {
    console.log({ question: state.value, context: state.context });
    if (state.value === "start") {
      service.send({ type: "next" });
      return;
    }

    if (state.done) {
      // TODO, get SSO for policy
      console.log(`finished on ${state.value}`);

      return;
    }

    if (state.value === "accountCreate") {
      console.log("Creating your account...");
      return;
    }

    if (state.value === "protections") {
      const { protections } = await prompts({
        type: "multiselect",
        name: "protections",
        message: "Question: Protections",
        choices: [
          { title: "Spouse", value: "spouse" },
          { title: "Children", value: "children" },
          { title: "Fiance", value: "fiance" },
          { title: "Partner", value: "partner" },
        ],
      });

      service.send({ type: "next", protections });
      return;
    }

    if (state.value === "goals") {
      const { goals } = await prompts({
        type: "multiselect",
        name: "goals",
        message: "Question: Goals",
        choices: [
          { title: "Retirement", value: "retirement" },
          { title: "Mortgage", value: "mortgage" },
          { title: "Unsure", value: "unsure" },
        ],
      });

      service.send({ type: "next", goals });
      return;
    }

    if (state.value === "email") {
      const { email } = await prompts({
        type: "text",
        name: "email",
        message: "What is your email?",
      });

      service.send({ type: "next", email });
      return;
    }

    if (state.value === "birthCountry") {
      const { birthCountry } = await prompts({
        type: "select",
        name: "birthCountry",
        message: "Question: birthCountry",
        choices: [
          { title: "United States", value: "United States" },
          { title: "Other", value: "Other" },
        ],
      });

      service.send({ type: "next", birthCountry });
      return;
    }

    await prompts({
      type: "confirm",
      name: state.value,
      message: `Question: ${state.value}`,
    });
    service.send({ type: "next" });
    return;
  });

  service.start();
})();

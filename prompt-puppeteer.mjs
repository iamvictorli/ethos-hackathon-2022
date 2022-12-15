import prompts from "prompts";
import { createMachine, assign, interpret } from "xstate";
import puppeteer from "puppeteer";
import { getDocument, queries, waitFor } from "pptr-testing-library";

const { getByTestId, getByLabelText, getByRole, getByText } = queries;

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
            // {
            //   target: "intent",
            //   cond: "howItWorksFirst",
            //   actions: ["saveProtections"],
            // },
            // {
            //   target: "goals",
            //   cond: "protectionsFirst",
            //   actions: ["saveProtections"],
            // },
            // {
            //   target: "howItWorks",
            //   cond: "goalsFirst",
            //   actions: ["saveProtections"],
            // },
            {
              target: "email",
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
        console.log("mock create account service");
        return new Promise((res) => {
          res({
            user: null,
            identity: null,
            policy: null,
          });
        });
      },
    },
  }
);

const eventHistory = [];

(async () => {
  const service = interpret(questionMachine).onTransition(async (state) => {
    console.log({ question: state.value, context: state.context });

    if (state.value === "start") {
      service.send({ type: "next" });
      return;
    }

    if (state.done) {
      // TODO, get SSO for policy

      const browser = await puppeteer.launch({ headless: false });
      const page = await browser.newPage();

      await page.goto("http://localhost:5173");

      console.log({ eventHistory });

      for (const userEvent of eventHistory) {
        const { question } = userEvent;
        if (question === "email") {
          const document = await getDocument(page);
          // couldnt get getByRole to work, so use getByLabelText
          const emailInput = await getByLabelText(document, /email/i);
          await emailInput.type(userEvent.email);
          // type email
          // go next
          const nextButton = await getByText(document, /next/i);
          await nextButton.click();
        } else if (question === "protections") {
          const protections = userEvent.protections;

          // for (const protection of protections) {
          //   console.log({ protection });
          //   if (protection === "children") {
          //     await page.waitForSelector("aria/children");
          //     waitFor(() =>
          //       getByRole(document, "checkbox", {
          //         name: /children/i,
          //       })
          //     );
          //     const protectionButton = await getByRole(document, "checkbox", {
          //       name: /children/i,
          //     });
          //     console.log(protectionButton);
          //     await protectionButton.click();
          //   } else if (protection === "spouse") {
          //     const button = await page.waitForSelector("aria/Spouse");
          //     console.log(button);
          //     waitFor(() =>
          //       getByRole(document, "checkbox", {
          //         name: /spouse/i,
          //       })
          //     );
          //     const protectionButton = await getByTestId(document, /spouse/i);
          //     await protectionButton.select();
          //   } else if (protection === "fiance") {
          //     waitFor(() =>
          //       getByRole(document, "checkbox", {
          //         name: /fiance/i,
          //       })
          //     );
          //     const protectionButton = await getByRole(document, "checkbox", {
          //       name: /fiance/i,
          //     });
          //     await protectionButton.click();
          //   } else if (protection === "partner") {
          //     waitFor(() =>
          //       getByRole(document, "checkbox", {
          //         name: /partner/i,
          //       })
          //     );
          //     const protectionButton = await getByRole(document, "checkbox", {
          //       name: /partner/i,
          //     });
          //     await protectionButton.click();
          //   }
          // }
        }
      }

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

      eventHistory.push({ type: "next", protections, question: state.value });
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

      eventHistory.push({ type: "next", goals, question: state.value });
      service.send({ type: "next", goals });
      return;
    }

    if (state.value === "email") {
      const { email } = await prompts({
        type: "text",
        name: "email",
        message: "What is your email?",
      });

      eventHistory.push({ type: "next", email, question: state.value });
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

      eventHistory.push({ type: "next", birthCountry, question: state.value });
      service.send({ type: "next", birthCountry });
      return;
    }

    await prompts({
      type: "confirm",
      name: state.value,
      message: `Question: ${state.value}`,
    });
    eventHistory.push({ type: "next", question: state.value });
    service.send({ type: "next" });
    return;
  });

  service.start();
})();

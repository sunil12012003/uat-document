"use server";
import { NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const schema = z.object({
    firstPage: z.object({
        releaseNumber: z.string(),
        title: z.string(),
        date: z.string(),
    }),
    thirdPage: z.object({
        documentPurpose: z.string().describe("it should maximum of two lines.example : This document focuses on the UAT Sign-off referencing change request for addition of column"),
        revisionHistory: z.object({
            version: z.string(),
            filename: z.string(),
            updatedBy: z.string(),
            updatedOn: z.string(),
        }),
    }),
    fourthPage: z.object({
        scope: z.string(),
        // implementationChanges: z.string(),
        testScenarios: z.array(
            z.object({
                testCaseNumber: z.number(),
                testCase: z.string(),
                validation: z.string(),
            })
        ),
        testResults: z.array(
            z.object({
                testCaseNumber: z.number(),
                result: z.string(),
                status: z.string(),
            })
        ),
    }),
});
function getDocumentTypeFromPurpose(purpose) {
    const lower = purpose.toLowerCase();

    if (lower.includes("data sharing")) return "DATASHARING";
    if (lower.includes("new table") || lower.includes("onboarding") || lower.includes("table creation")) return "ONBOARDING_NEW_TABLE";
    if (lower.includes("column")) return "ADDITION_OF_NEW_COLUMNS";
    if (lower.includes("config") || lower.includes("configuration")) return "CONFIGURATION_CHANGE";

    return "GENERAL_CHANGE"; // fallback type
}

export async function POST(req) {
    try {
        const {
            releaseNumber,
            title,
            updatedBy,
            date,
            spokeName,
            documentPurpose,
            scope,
            // implementation,
            testScenarios,
            testScenarioCount,
        } = await req.json();

        // console.log("Received data:", {
        //     releaseNumber,
        //     title,
        //     updatedBy,
        //     date,
        //     spokeName,
        //     processDescription,
        //     testScenarios,
        //     testScenarioCount,
        // });
        const docType = getDocumentTypeFromPurpose(documentPurpose);

        const { object } = await generateObject({
            model: google("gemini-1.5-flash"),
            schema,
            prompt: `
Generate a structured UAT Sign-Off document using the fields below.

--- Input Data ---
Release Number: ${releaseNumber}
Title: ${title}
Updated By: ${updatedBy}
Updated On: ${date}
Spoke Name: ${spokeName}
Document Purpose: ${documentPurpose}
Scope: ${scope}

Test Scenarios:
${testScenarios.map((s, i) => `${i + 1}. ${s}`).join("\n")}
Total Test Scenarios: ${testScenarioCount}

--- Output Structure ---
Return a structured object with the following fields: firstPage, thirdPage, and fourthPage. Do not include any extra pages.

1. firstPage:
- releaseNumber: Use UPPERCASE format.
- title: Use UPPERCASE format.
- date: Use the input date directly.

2. thirdPage:
- documentPurpose:  This document focused on requestion uat sign-off for (based on addition of table , new columnn, datatsharing ) spoke .grammatically correct lines.
- revisionHistory:
  - version: "v1.0"
  - filename: "Release Number_${docType}_FOR_${spokeName}_UAT_SIGNOFF" .filename everything should be capital.
  - updatedBy: Capitalize each word in the name.
  - updatedOn: Same as input date.

3. fourthPage:
- scope:
  - Begin with the sentence: "The scope of the [configuration/column/table] changes is as follows:".
  - Follow with neccessary bullet point even 1 also should be fine and concise bullet points that summarize the changes.
  - Use formal language consistent with UAT documentation.
  - If more than 3 columns or tables are involved, summarize instead of listing (e.g., "Addition of 4 columns across 3 tables.").
  - Avoid vague phrases like "NA" or "Not Applicable".
  - Example scope structure:
    The scope of the column changes is as follows:
    1. Added columns ID_DISCENTRE and DS_DISCENTRE to the SalesOrder table.
    2. Updated associated configurations to reflect the new columns.
    3. Validated data pipeline compatibility with new schema.
    4. if user mentioned - > added ddl and config for new table.
    5. if user mentioned -> added the schedule time in pipeline.


- implementationChanges:
  - If details exist, list concise bullet points.
  - If no details provided, omit this section entirely (do not output "NA").

- testScenarios:
  - Generate ${testScenarios.length} test cases.
  - Each "testCase" must be concise (≤ 7 words).
  - Each "validation" must clearly explain the expected outcome.

- testResults:
  - Generate ${testScenarioCount} results.
  - result: Brief, meaningful outcome (4–8 words).
  - status: Only "Pass" or "Fail".

--- Additional Rules ---
- Do not include a "secondPage".
- Keep content concise, professional, and grammatically correct.
- Format the final output strictly as an object with three keys: firstPage, thirdPage, fourthPage.
`,


        });

        return NextResponse.json({ data: object });
    } catch (err) {
        console.error("AI response error:", err);
        return NextResponse.json(
            {
                success: false,
                error: "Failed to generate structured document",
                details: err.message,
            },
            { status: 500 }
        );
    }
}
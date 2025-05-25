import {
    Document,
    Packer,
    Paragraph,
    Table,
    TableRow,
    TableCell,
    TextRun,
    HeadingLevel,
    ImageRun,
    BorderStyle,
    ShadingType,
} from "docx";
import { saveAs } from "file-saver";


const getImageArrayBuffer = async (relativePath) => {
    const response = await fetch(relativePath);
    if (!response.ok) {
        throw new Error("Failed to load image: " + response.statusText);
    }
    const blob = await response.blob();
    return await blob.arrayBuffer();
};






const DocBuilder = ({ data, testScenarios }) => {
    const buildDocument = async () => {
        const { firstPage, thirdPage, fourthPage } = data.data;


        const imageData = await getImageArrayBuffer('/image.jpeg');
    
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: { top: 720, bottom: 720 },
                        },
                    },
                    children: [
                        new Paragraph({
                            children: [
                                new ImageRun({
                                    data: imageData,
                                    transformation: {
                                        width: 150,
                                        height: 100,
                                    },
                                }),
                            ],
                            alignment: "right",
                        }),
                        new Paragraph({
                            children: [],
                            spacing: { before: 3000 },
                        }),

                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `[${firstPage.releaseNumber}]`,
                                    bold: true,
                                    size: 26,
                                    font: "Calibri (Body)",
                                }),
                            ],

                            spacing: { after: 300 },
                        }),
                        //newly replaced
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `${firstPage.title} UAT signoff`,
                                    bold: true,
                                    size: 36,
                                    font: "Montserrat",
                                    color: '00008b'
                                }),
                            ],
                            border: {
                                top: { style: BorderStyle.SINGLE, size: 12, color: "00008b" },
                                bottom: { style: BorderStyle.SINGLE, size: 12, color: "00008b" },
                            },
                            spacing: { after: 300 },
                        }),


                        //stop
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: `[${firstPage.date}]`,
                                    size: 30,
                                    font: "Montserrat",
                                }),
                            ],
                        }),

                        new Paragraph({ children: [], pageBreakBefore: true }),

                        new Paragraph({
                            text: "1. Document Control",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                            size: 20,
                            border: {
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            },
                        }),
                        new Paragraph({
                            text: "1.1 Table of Contents",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                            size: 20,
                        }),
                        ...[
                            "1 Document Control",
                            "   1.1 Table of Control...............................................................................................................................................................2",
                            "   1.2 Document Purpose.....................................................................................................................................................2",
                            "   1.3 Revision History..............................................................................................................................................................3",
                            "2 Scope...........................................................................................................................................................................................3",
                            "3 Test Scenario..........................................................................................................................................................................4",
                            "4 Test Results.............................................................................................................................................................................4",
                        ].map(
                            (item) =>
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: item,
                                            size: 20, // 14pt font
                                            font: "Montserrat",
                                        }),
                                    ],
                                    spacing: { after: 100 },
                                })
                        ),

                        new Paragraph({ children: [], pageBreakBefore: true }),

                        new Paragraph({
                            text: "1.2 Document Purpose",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                        }),
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: thirdPage.documentPurpose,
                                    size: 20,
                                    font: "Montserrat",
                                }),
                            ],
                            spacing: { after: 300 },
                        }),
                        new Paragraph({
                            text: "1.3 Revision History",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                        }),
                        generateTable(
                            [
                                [
                                    { text: "Version", shaded: true },
                                    { text: "Filename", shaded: true },
                                    { text: "Updated By", shaded: true },
                                    { text: "Updated On", shaded: true },
                                ],
                                [
                                    thirdPage.revisionHistory.version,
                                    thirdPage.revisionHistory.filename
                                        .replace(/\.docx$/i, "")
                                        .replace(" ", "_"),
                                    thirdPage.revisionHistory.updatedBy,
                                    thirdPage.revisionHistory.updatedOn,
                                ],
                            ],
                            20, // font size
                            "D3D3D3"
                            
                        ),

                        new Paragraph({ children: [], pageBreakBefore: true }),

                        new Paragraph({
                            text: "2 Scope",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                            border: {
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            },
                        }),
                        ...parseScopeText(fourthPage.scope), // 🔁 Replace old single paragraph with parsed bullets


                        new Paragraph({
                            text: "3. Test Scenario",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                        }),
                        generateTable(
                            [
                                [
                                    { text: "Test Case Number", shaded: true },
                                    { text: "Test Case", shaded: true },
                                    { text: "Validation", shaded: true },
                                ],
                                ...fourthPage.testScenarios.map((s) => [
                                    s.testCaseNumber.toString(),
                                    s.testCase,
                                    s.validation,
                                ]),
                                ["", "", ""],
                                ["", "", ""],
                            ],
                            20, // font size
                            "D3D3D3"
                        ),
                        

                        new Paragraph({ children: [], pageBreakBefore: true }),
                        new Paragraph({
                            text: "4. Test Results",
                            heading: HeadingLevel.HEADING_3,
                            spacing: { after: 200 },
                            border: {
                                bottom: { style: BorderStyle.SINGLE, size: 6, color: "000000" },
                            },
                        }),
                        await generateTestResultsTable(testScenarios, fourthPage),
                    ],
                },
            ],
        });

        const blob = await Packer.toBlob(doc);
        saveAs(blob, `${thirdPage.revisionHistory.filename}.docx`);
    };

    const generateTable = (rows, fontSize = 20, headerColor = "D3D3D3", columnWidths = []) =>
        new Table({
            rows: rows.map((cells, rowIndex) =>
                new TableRow({
                    children: cells.map((cell, colIndex) =>
                        new TableCell({
                            width: columnWidths[colIndex]
                                ? { size: columnWidths[colIndex], type: "pct" }
                                : undefined,
                            children: [
                                new Paragraph({
                                    children: [
                                        new TextRun({
                                            text: typeof cell === "object" ? cell.text : cell,
                                            size: fontSize,
                                            font: "Montserrat",
                                        }),
                                    ],
                                }),
                            ],
                            shading:
                                typeof cell === "object" && cell.shaded && rowIndex === 0
                                    ? {
                                        fill: headerColor,
                                        type: ShadingType.CLEAR,
                                        color: "auto",
                                    }
                                    : undefined,
                            margins: {
                                top: 100,
                                bottom: 100,
                                left: 100,
                                right: 100,
                            },
                        })
                    ),
                })
            ),
            width: { size: 100, type: "pct" },
        });



    const generateTestResultsTable = async (scenarios, fourthPage) => {
        const header = new TableRow({
            children: ["Test Case Number", "Result", "Status"].map(
                (text) =>
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text,
                                        bold: true,
                                        size: 20,
                                        font: "Montserrat",
                                    }),
                                ],
                            }),
                        ],
                        shading: {
                            fill: "D3D3D3", // light gray
                            type: ShadingType.CLEAR,
                            color: "auto",
                        },
                        margins: {
                            top: 100,
                            bottom: 100,
                            left: 100,
                            right: 100,
                        },
                    })
            ),
        });
        
        

        const bodyRows = await Promise.all(
            scenarios.map(async (s, i) => {
                const testResult = fourthPage.testResults[i];

                const cells = [
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: `${testResult.testCaseNumber}`,
                                        size: 20,
                                        font: "Montserrat",
                                    }),
                                ],
                            }),
                        ],
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: testResult.result,
                                        size: 20,
                                        font: "Montserrat",
                                    }),
                                ],
                                spacing: { after: 200 },
                            }),
                            ...(s.base64Image
                                ? [
                                    new Paragraph({
                                        children: [
                                            new ImageRun({
                                                data: await fetch(s.base64Image).then((r) =>
                                                    r.arrayBuffer()
                                                ),
                                                transformation: { width: 300, height: 180 },
                                            }),
                                        ],
                                    }),
                                ]
                                : [new Paragraph("No Image")]),
                        ],
                    }),
                    new TableCell({
                        children: [
                            new Paragraph({
                                children: [
                                    new TextRun({
                                        text: testResult.status,
                                        size: 20,
                                        font: "Montserrat",
                                    }),
                                ],
                            }),
                        ],
                    }),
                ];

                return new TableRow({ children: cells });
            })
        );

        return new Table({
            rows: [header, ...bodyRows],
            width: { size: 100, type: "pct" },
        });
    };

    return (
        <button onClick={buildDocument} className="btn btn-success mt-3">
            Download Word Document
        </button>
    );
};

const parseScopeText = (scopeText) => {
    const lines = scopeText
        .split(/\r?\n|•|\*/g)
        .map(line => line.trim())
        .filter(line => line.length > 0);

    const paragraphs = [];


    if (lines.length > 0) {
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: lines[0],
                        size: 20,
                        font: "Montserrat",
                    }),
                ],
                spacing: { after: 200 },
            })
        );
    }


    for (let i = 1; i < lines.length; i++) {
        paragraphs.push(
            new Paragraph({
                children: [
                    new TextRun({
                        text: lines[i],
                        size: 20,
                        font: "Montserrat",
                    }),
                ],
                bullet: { level: 0 },
                spacing: { after: 100 },
            })
        );
    }

    return paragraphs;
};


export default DocBuilder;
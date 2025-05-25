"use client";
import React, { useState } from "react";
import axios from "axios";
import DocBuilder from "../components/DocBuilder";

const Home = () => {
  const [releaseNumber, setReleaseNumber] = useState("");
  const [title, setTitle] = useState("");
  const [spokeName, setSpokeName] = useState("");
  const [implementation,setImplementation] = useState("");
  const [updatedBy, setUpdatedBy] = useState("");
  const [date, setDate] = useState("");
  const [testScenarios, setTestScenarios] = useState([
    { testCase: "", validation: "", image: null },
  ]);
  const [documentPurpose, setDocumentPurpose] = useState("");
  const [scope, setScope] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);



  const convertImagesToBase64 = (files) => {
    return Promise.all(
      files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(file);
        });
      })
    );
  };

  const handleTestScenarioChange = (index, field, value) => {
    const updated = [...testScenarios];
    updated[index][field] = value;
    setTestScenarios(updated);
  };

  const addTestScenario = () => {
    setTestScenarios([
      ...testScenarios,
      { testCase: "", validation: "", image: null },
    ]);
  };

  const removeTestScenario = (indexToRemove) => {
    setTestScenarios(
      testScenarios.filter((_, index) => index !== indexToRemove)
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {

      const testScenarioImages = await convertImagesToBase64(
        testScenarios.map((s) => s.image).filter(Boolean)
      );

      const testScenariosWithBase64 = testScenarios.map((s, index) => ({
        ...s,
        base64Image: s.image ? testScenarioImages[index] : null,
      }));

      const formData = {
        releaseNumber,
        title,
        spokeName,
        documentPurpose,
        scope,
        implementation,
        updatedBy,
        date,
        testScenarios: testScenarios.map((s) => s.validation),
        testScenarioCount: testScenarios.length,
      };


      const response = await axios.post("/api/ai", formData, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      setAiResponse({
        data: response.data,
        testScenarios: testScenariosWithBase64,
      });
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="card shadow">
        <div className="card-body">
          <h2 className="card-title mb-4 text-center">
            Create UAT Word Document
          </h2>

          <form onSubmit={handleSubmit}>
            <Input
              label="Release Number"
              value={releaseNumber}
              onChange={setReleaseNumber}
            />
            <Input label="Title" value={title} onChange={setTitle} />
            <Input label="Spoke Name" value={spokeName} onChange={setSpokeName} />
            <Input
              label="Document Purpose"
              value={documentPurpose}
              onChange={setDocumentPurpose}
            />
            <Input
              label="Scope(implementations)"
              value={scope}
              onChange={setScope}
            />
            {/* <Input
              label="implementation"
              value={implementation}
              onChange={setImplementation}
            /> */}

            <Input label="Updated By(Name)" value={updatedBy} onChange={setUpdatedBy} />
            <Input label="Date" type="date" value={date} onChange={setDate} />



            <div className="mb-3">
              <h5>Test Scenarios</h5>
              {testScenarios.map((scenario, index) => (
                <div key={index} className="row g-2 align-items-center mb-2">
                  <div className="col-md-4">
                    <input
                      type="text"
                      placeholder="Test Case"
                      value={scenario.testCase}
                      onChange={(e) =>
                        handleTestScenarioChange(index, "testCase", e.target.value)
                      }
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-4">
                    <input
                      type="text"
                      placeholder="Validation"
                      value={scenario.validation}
                      onChange={(e) =>
                        handleTestScenarioChange(index, "validation", e.target.value)
                      }
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleTestScenarioChange(index, "image", e.target.files[0])
                      }
                      className="form-control"
                    />
                  </div>
                  <div className="col-md-1">
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() => removeTestScenario(index)}
                      disabled={testScenarios.length === 1}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addTestScenario}
                className="btn btn-link p-0 mt-2"
              >
                + Add Another Scenario
              </button>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                isLoading ||
                !releaseNumber ||
                !title ||
                !spokeName ||
                !updatedBy ||
                !date
              }
            >
              {isLoading ? "Generating..." : "Generate Word Document"}
            </button>
          </form>

          {aiResponse?.data && (
            <div className="mt-4">
              <h5 className="fw-bold">Generated Data:</h5>
              <pre className="bg-light p-3 rounded border">
                {JSON.stringify(aiResponse.data, null, 2)}
              </pre>
              <DocBuilder
                data={aiResponse.data}
                testScenarios={aiResponse.testScenarios}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Reusable Input Component
const Input = ({ label, value, onChange, type = "text" }) => (
  <div className="mb-3">
    <label className="form-label">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="form-control"
    />
  </div>
);

export default Home;
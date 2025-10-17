import React, { useState } from "react";
import axios from "axios";
import CodeEditor from "./Editor";
import Output from "./Output";

const JUDGE0_API = "http://104.236.56.159:2358";

function App() {
  const [language, setLanguage] = useState("python");
  const [sourceCode, setSourceCode] = useState("print('Hello, Judge0!')");
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [time, setTime] = useState("");
  const [memory, setMemory] = useState("");

  const languageMap = { python: 71, cpp: 54, java: 62, javascript: 63 };

  const runCode = async () => {
    setOutput("");
    setError("");
    setTime("");
    setMemory("");
    try {
      const payload = { language_id: languageMap[language], source_code: sourceCode, stdin: input };
      // thanks to "proxy" in package.json you can also call "/submissions..." without host
      const res = await axios.post(`${JUDGE0_API}/submissions/?base64_encoded=false&wait=true`, payload);
      const data = res.data;
      setOutput(data.stdout || "");
      setError(data.stderr || data.compile_output || "");
      setTime(data.time);
      setMemory(data.memory);
    } catch (e) {
      console.error(e);
      setError("❌ Error connecting to Judge0 API.");
    }
  };

  return (
    <div style={{ padding:"20px", background:"#1e1e1e", color:"#fff", minHeight:"100vh" }}>
      <h2>⚙️ Judge0 Online IDE</h2>

      <div style={{ marginBottom:"10px" }}>
        <label htmlFor="language" style={{ marginRight:"10px" }}>Language:</label>
        <select id="language" value={language} onChange={(e)=>setLanguage(e.target.value)} style={{ padding:"5px" }}>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="javascript">JavaScript</option>
        </select>
      </div>

      <CodeEditor language={language === "cpp" ? "cpp" : language} value={sourceCode} onChange={setSourceCode} />

      <textarea placeholder="Input" rows="3" style={{ width:"100%", marginTop:"10px", padding:"5px" }}
        value={input} onChange={(e)=>setInput(e.target.value)} />

      <button onClick={runCode} style={{ marginTop:"10px", padding:"8px 16px", background:"#007acc", border:"none", color:"white", cursor:"pointer", borderRadius:"4px" }}>
        ▶ Run Code
      </button>

      <Output output={output} error={error} time={time} memory={memory} />
    </div>
  );
}

export default App;

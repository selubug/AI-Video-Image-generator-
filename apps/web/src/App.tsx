import './App.css';
import { PresetList } from './components/PresetList';

function App() {
  return (
    <div className="App">
      <h1>Prompt Helper</h1>
      <div style={{ display: 'flex', border: '1px solid lightgrey', minHeight: '80vh' }}>
        {/* Left Panel */}
        <div style={{ width: '300px', borderRight: '1px solid lightgrey', padding: '10px', overflowY: 'auto' }}>
          <PresetList />
        </div>

        {/* Center Panel */}
        <div style={{ flex: 1, padding: '10px' }}>
          Center Panel (Input Area)
        </div>

        {/* Right Panel */}
        <div style={{ width: '300px', borderLeft: '1px solid lightgrey', padding: '10px' }}>
          Right Panel (AI Agent)
        </div>
      </div>
    </div>
  );
}

export default App;

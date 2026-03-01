import React from 'react';
import Button from '../../Button';
import Card from '../../Card';

const ScenarioView = ({
  scenario,
  response,
  setResponse,
  isListening,
  onSpeak,
  onStartListening,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="slide-up">
      <Card title={scenario.title}>
        <div className="scenario-actions">
          <Button variant="outline" onClick={() => onSpeak(scenario.content)} icon="🔊" className="w-auto">
            Relire
          </Button>
        </div>
      
        <div className="message-box">
          {scenario.content}
        </div>
      </Card>
      
      <label htmlFor="response" className="instruction-label">
        ❓ Que faites-vous face à ce message ?
      </label>
      
      <div className="input-area">
        <textarea 
          id="response"
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Ex: Je supprime le message..."
        />
        
        <Button 
          onClick={onStartListening} 
          variant={isListening ? 'danger' : 'outline'}
          icon={isListening ? '🛑' : '🎙️'}
        >
          {isListening ? '🛑 Écoute...' : '🎙️ Dicter'}
        </Button>
      </div>

      <Button onClick={onSubmit} disabled={!response} variant="primary">
        ✅ Valider ma réponse
      </Button>
      <div style={{ height: '16px' }}></div>
      <Button onClick={onCancel} variant="outline">
        Annuler
      </Button>
    </div>
  );
};

export default ScenarioView;
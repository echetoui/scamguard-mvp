import React from 'react';
import Button from '../../Button';
import Card from '../../Card';

const DetectionView = ({
  image,
  response,
  setResponse,
  onImageUpload,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="slide-up">
      <Card title="📸 Analyse de message">
        <p>Prenez une photo de l'écran ou du message qui vous inquiète.</p>
        
        <label className="file-upload-btn">
          <input 
            type="file" 
            accept="image/*" 
            capture="environment"
            onChange={onImageUpload}
          />
          <span>📷 Prendre une photo</span>
        </label>
        
        {image && <p className="success-msg">✅ Photo ajoutée !</p>}
        
        <textarea 
          value={response}
          onChange={e => setResponse(e.target.value)}
          placeholder="Ou décrivez ce qui vous semble bizarre..."
          aria-label="Description du message suspect"
        />
        
        <Button onClick={onSubmit} variant="primary" icon="🔍">Lancer l'analyse</Button>
        <div style={{ height: '16px' }}></div>
        <Button onClick={onCancel} variant="outline">Retour</Button>
      </Card>
    </div>
  );
};

export default DetectionView;
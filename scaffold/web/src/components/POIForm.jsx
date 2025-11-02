import React, { useState } from 'react';

const POIForm = ({ initialName = '', initialType = 'booth', onCancel, onSubmit }) => {
  const [name, setName] = useState(initialName);
  const [type, setType] = useState(initialType);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name) return;
    onSubmit({ name, type });
  };

  return (
    <div style={{ position: 'fixed', left: 0, top: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 16, borderRadius: 8, width: 360, boxShadow: '0 6px 18px rgba(0,0,0,0.15)' }}>
        <h3 style={{ marginTop: 0 }}>Add POI</h3>
        <div style={{ marginBottom: 8 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Name</label>
          <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #e5e7eb' }} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>Type</label>
          <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', padding: '8px 10px', borderRadius: 4, border: '1px solid #e5e7eb' }}>
            <option value="localization">localization</option>
            <option value="booth">booth</option>
            <option value="utility">utility</option>
            <option value="other">other</option>
          </select>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <button type="button" onClick={onCancel} style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #e5e7eb', background: 'white' }}>Cancel</button>
          <button type="submit" style={{ padding: '8px 12px', borderRadius: 4, border: 'none', background: '#059669', color: 'white' }}>Save POI</button>
        </div>
      </form>
    </div>
  );
};

export default POIForm;

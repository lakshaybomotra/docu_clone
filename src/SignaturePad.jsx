import { useRef } from 'react';
import PropTypes from 'prop-types';
import SignatureCanvas from 'react-signature-canvas';

const SignaturePad = ({ onSave, onClose }) => {
  const sigPad = useRef(null);

  const clear = () => {
    sigPad.current.clear();
  };

  const save = () => {
    if (!sigPad.current.isEmpty()) {
      const signatureData = sigPad.current.toDataURL();
      onSave(signatureData);
      onClose();
    }
  };

  return (
    <div className="signature-pad-container">
      <SignatureCanvas
        ref={sigPad}
        canvasProps={{
          className: 'signature-canvas',
          width: 500,
          height: 200
        }}
      />
      <div className="signature-pad-buttons">
        <button onClick={clear}>Clear</button>
        <button onClick={save}>Save</button>
        <button onClick={onClose}>Cancel</button>
      </div>
    </div>
  );
};
SignaturePad.propTypes = {
  onSave: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default SignaturePad;

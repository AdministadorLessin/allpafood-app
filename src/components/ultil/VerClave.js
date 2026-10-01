import React, { useState } from 'react';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

/**
 * El ojito para ver lo que se esta escribiendo en una contraseña.
 *
 * La contraseña guardada no se puede mostrar —se guarda cifrada y nadie, ni
 * operacion, la puede leer—, pero casi todos los "no me deja entrar" son una
 * letra mal tecleada en el celular. Ver lo que se escribe lo resuelve.
 *
 * Uso: const clave = useVerClave();  <TextField type={clave.type} InputProps={clave.InputProps} />
 */
export const useVerClave = () => {
  const [visible, setVisible] = useState(false);
  return {
    type: visible ? 'text' : 'password',
    InputProps: {
      endAdornment: (
        <InputAdornment position="end">
          <IconButton
            aria-label={visible ? 'Ocultar contraseña' : 'Ver contraseña'}
            onClick={() => setVisible((v) => !v)}
            onMouseDown={(e) => e.preventDefault()}
            edge="end"
          >
            {visible ? <VisibilityOff /> : <Visibility />}
          </IconButton>
        </InputAdornment>
      ),
    },
  };
};

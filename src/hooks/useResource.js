import { useCallback, useEffect, useState } from 'react';
import { errorMessage } from '../api/client';
export function useResource(loader, dependencies = []) {
  const [state, setState] = useState({ data: null, loading: true, error: '' });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision(value => value + 1), []);
  useEffect(() => {
    let current = true;
    setState(previous => ({ ...previous, loading: true, error: '' }));
    Promise.resolve().then(loader).then(data => { if (current) setState({ data, loading: false, error: '' }); })
      .catch(error => { if (current) setState(previous => ({ ...previous, loading: false, error: errorMessage(error) })); });
    return () => { current = false; };
  }, [...dependencies, revision]);
  return { ...state, reload };
}

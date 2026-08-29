/* eslint-disable complexity */
import {
    forwardRef,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef
  } from 'react';
  
  import { GoogleMapsContext, useMapsLibrary } from '@vis.gl/react-google-maps';
  
  function usePolygon(props) {
    const {
      onClick,
      onDrag,
      onDragStart,
      onDragEnd,
      onMouseOver,
      onMouseOut,
      encodedPaths,
      ...polygonOptions
    } = props;
  
    const callbacks = useRef({});
    Object.assign(callbacks.current, {
      onClick,
      onDrag,
      onDragStart,
      onDragEnd,
      onMouseOver,
      onMouseOut
    });
  
    const geometryLibrary = useMapsLibrary('geometry');
  
    const polygon = useRef(new window.google.maps.Polygon()).current;
  
    useMemo(() => {
      polygon.setOptions(polygonOptions);
    }, [polygonOptions]);
  
    const map = useContext(GoogleMapsContext)?.map;
  
    useMemo(() => {
      if (!encodedPaths || !geometryLibrary) return;
      const paths = encodedPaths.map(path =>
        geometryLibrary.encoding.decodePath(path)
      );
      polygon.setPaths(paths);
    }, [encodedPaths, geometryLibrary]);
  
    useEffect(() => {
      if (!map) {
        if (map === undefined)
          console.error('<Polygon> has to be inside a Map component.');
  
        return;
      }
  
      polygon.setMap(map);
  
      return () => {
        polygon.setMap(null);
      };
    }, [map]);
  
    useEffect(() => {
      if (!polygon) return;
  
      const gme = window.google.maps.event;
      [
        ['click', 'onClick'],
        ['drag', 'onDrag'],
        ['dragstart', 'onDragStart'],
        ['dragend', 'onDragEnd'],
        ['mouseover', 'onMouseOver'],
        ['mouseout', 'onMouseOut']
      ].forEach(([eventName, eventCallback]) => {
        gme.addListener(polygon, eventName, (e) => {
          const callback = callbacks.current[eventCallback];
          if (callback) callback(e);
        });
      });
  
      return () => {
        gme.clearInstanceListeners(polygon);
      };
    }, [polygon]);
  
    return polygon;
  }
  
  /**
   * Component to render a polygon on a map
   */
  export const Polygon = forwardRef((props, ref) => {
    const polygon = usePolygon(props);
  
    useImperativeHandle(ref, () => polygon, []);
  
    return null;
  });
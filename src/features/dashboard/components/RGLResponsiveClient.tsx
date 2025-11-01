'use client';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './rgl-overrides.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

export default ResponsiveGridLayout;


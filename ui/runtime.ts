// Pinned upstream runtime. Kept separate so extension lint still checks all application code.
import * as React from 'react';
import * as JSX from 'react/jsx-runtime';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
Object.assign(globalThis, {SubmetaReactRuntime:{React,JSX,createRoot,flushSync}});

import Home from 'componentes/Home';
import { Login } from './Controllers/Login';
import Catalogo from 'componentes/Catalogo';
import LayoutConSidebar from 'componentes/LayoutConSidebar';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} /> 
        {/* Rutas que van dentro del menu */}
        <Route element={<LayoutConSidebar />}>
          <Route path="/home" element={<Home />} />
          <Route path="/catalogo" element={<Catalogo />} />
        </Route>
        
      </Routes>
    </BrowserRouter>
  );
}

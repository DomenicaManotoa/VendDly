import { FacebookOutlined, InstagramOutlined, MailOutlined, PhoneOutlined, WhatsAppOutlined } from "@ant-design/icons";
import { Typography } from "antd";

export const FooterCustom = () => (
  <footer style={{ textAlign: 'center', padding: '16px 50px', backgroundColor: '#A1BC3F' }}>
    <Typography.Text>
      © 2025 Vendly. Todos los derechos reservados. <br /> 
      Desarrollado por SDR SA. | Contacto: <PhoneOutlined /> 099999999 | <MailOutlined /> soporte@SDR.com <br /> 
      Síguenos en: <FacebookOutlined /> Facebook | <InstagramOutlined /> Instagram | <WhatsAppOutlined /> WhatsApp
    </Typography.Text>
  </footer>
);
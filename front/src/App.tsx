import * as React from 'react';
import { Button, Card, DatePicker, Space, version } from 'antd';
import type { DatePickerProps } from 'antd';

function App() {
  const onChange: DatePickerProps['onChange'] = (date, dateString) => {
    console.log(date, dateString);
  };

  return (
    <div style={{ padding: '24px' }}>
      <Card title={`Ant Design v${version} + TypeScript`} style={{ width: 400 }}>
        <Space direction="vertical" size={12}>
          <DatePicker onChange={onChange} />
          <Button type="primary">Botón Primario</Button>
        </Space>
      </Card>
    </div>
  );
}

export default App

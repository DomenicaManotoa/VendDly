import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Row, 
  Col, 
  Statistic, 
  Button, 
  Table, 
  Tag, 
  Space, 
  Modal, 
  message, 
  List,
  Alert,
  Spin,
  Progress
} from 'antd';
import { 
  EnvironmentOutlined, 
  UserOutlined, 
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  SyncOutlined,
  FileTextOutlined
} from '@ant-design/icons';
import { clienteService } from '../Clientes/clienteService';
import { ubicacionClienteService } from '../../Admin/ubicacionCliente/ubicacionClienteService';
import type { ColumnsType } from 'antd/es/table';

interface EstadisticasUbicaciones {
  totalClientes: number;
  clientesConUbicacionPrincipal: number;
  clientesSinUbicacionPrincipal: number;
  clientesSinUbicaciones: number;
  totalUbicaciones: number;
  promedioUbicacionesPorCliente: number;
  porSector: Record<string, number>;
}

interface ProblemaIntegridad {
  tipo: 'sin_ubicacion' | 'sin_principal' | 'principal_invalida';
  codCliente: string;
  descripcion: string;
  accionSugerida: string;
}

const DashboardUbicaciones: React.FC = () => {
  const [estadisticas, setEstadisticas] = useState<EstadisticasUbicaciones | null>(null);
  const [problemasIntegridad, setProblemasIntegridad] = useState<ProblemaIntegridad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingReparacion, setLoadingReparacion] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [tipoModal, setTipoModal] = useState<'estadisticas' | 'problemas' | 'reparacion'>('estadisticas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [estadisticasData, integridadData] = await Promise.all([
        clienteService.getEstadisticasClientes(),
        clienteService.verificarIntegridad()
      ]);

      setEstadisticas(estadisticasData);

      // Convertir datos de integridad a problemas
      const problemas: ProblemaIntegridad[] = [];

      integridadData.clientesSinUbicaciones.forEach(codCliente => {
        problemas.push({
          tipo: 'sin_ubicacion',
          codCliente,
          descripcion: 'Cliente sin ubicaciones registradas',
          accionSugerida: 'Crear ubicación para el cliente'
        });
      });

      integridadData.clientesSinUbicacionPrincipal.forEach(codCliente => {
        problemas.push({
          tipo: 'sin_principal',
          codCliente,
          descripcion: 'Cliente con ubicaciones pero sin ubicación principal',
          accionSugerida: 'Establecer ubicación principal automáticamente'
        });
      });

      integridadData.clientesConUbicacionPrincipalInvalida.forEach(codCliente => {
        problemas.push({
          tipo: 'principal_invalida',
          codCliente,
          descripcion: 'Ubicación principal inválida o inexistente',
          accionSugerida: 'Reasignar ubicación principal válida'
        });
      });

      setProblemasIntegridad(problemas);

    } catch (error) {
      console.error('Error al cargar datos del dashboard:', error);
      message.error('Error al cargar las estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const repararProblemas = async () => {
    try {
      setLoadingReparacion(true);
      
      const resultado = await clienteService.repararUbicacionesPrincipales();
      
      message.success(
        `Reparación completada: ${resultado.reparados} clientes reparados`
      );

      if (resultado.errores.length > 0) {
        Modal.warning({
          title: 'Algunos errores durante la reparación',
          content: (
            <List
              size="small"
              dataSource={resultado.errores}
              renderItem={error => <List.Item>{error}</List.Item>}
            />
          )
        });
      }

      // Mostrar detalles de las reparaciones
      if (resultado.detalles.length > 0) {
        setTipoModal('reparacion');
        setModalVisible(true);
      }

      // Recargar datos después de la reparación
      await cargarDatos();

    } catch (error) {
      console.error('Error al reparar problemas:', error);
      message.error('Error durante la reparación automática');
    } finally {
      setLoadingReparacion(false);
    }
  };

  const getColorProblema = (tipo: ProblemaIntegridad['tipo']) => {
    switch (tipo) {
      case 'sin_ubicacion': return 'red';
      case 'sin_principal': return 'orange';
      case 'principal_invalida': return 'red';
      default: return 'default';
    }
  };

  const getIconoProblema = (tipo: ProblemaIntegridad['tipo']) => {
    switch (tipo) {
      case 'sin_ubicacion': return <ExclamationCircleOutlined />;
      case 'sin_principal': return <WarningOutlined />;
      case 'principal_invalida': return <ExclamationCircleOutlined />;
      default: return <WarningOutlined />;
    }
  };

  const columnsProblemas: ColumnsType<ProblemaIntegridad> = [
    {
      title: 'Cliente',
      dataIndex: 'codCliente',
      key: 'codCliente',
    },
    {
      title: 'Problema',
      dataIndex: 'descripcion',
      key: 'descripcion',
    },
    {
      title: 'Tipo',
      dataIndex: 'tipo',
      key: 'tipo',
      render: (tipo: ProblemaIntegridad['tipo']) => (
        <Tag color={getColorProblema(tipo)} icon={getIconoProblema(tipo)}>
          {tipo === 'sin_ubicacion' && 'Sin Ubicaciones'}
          {tipo === 'sin_principal' && 'Sin Principal'}
          {tipo === 'principal_invalida' && 'Principal Inválida'}
        </Tag>
      )
    },
    {
      title: 'Acción Sugerida',
      dataIndex: 'accionSugerida',
      key: 'accionSugerida',
      ellipsis: true,
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <div style={{ marginTop: '16px' }}>Cargando estadísticas...</div>
      </div>
    );
  }

  const porcentajeUbicacionesPrincipales = estadisticas ? 
    Math.round((estadisticas.clientesConUbicacionPrincipal / estadisticas.totalClientes) * 100) : 0;

  const hayProblemas = problemasIntegridad.length > 0;

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2>Dashboard de Ubicaciones de Clientes</h2>
        <p style={{ color: '#666' }}>
          Resumen general del estado de las ubicaciones y su integridad
        </p>
      </div>

      {/* Alerta de problemas */}
      {hayProblemas && (
        <Alert
          message="Problemas de Integridad Detectados"
          description={`Se encontraron ${problemasIntegridad.length} problema(s) que requieren atención`}
          type="warning"
          showIcon
          action={
            <Space>
              <Button 
                size="small" 
                type="link"
                onClick={() => {
                  setTipoModal('problemas');
                  setModalVisible(true);
                }}
              >
                Ver Detalles
              </Button>
              <Button 
                size="small" 
                type="primary" 
                danger
                loading={loadingReparacion}
                onClick={repararProblemas}
                icon={<SyncOutlined />}
              >
                Reparar Automáticamente
              </Button>
            </Space>
          }
          style={{ marginBottom: '24px' }}
        />
      )}

      {/* Estadísticas principales */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Clientes"
              value={estadisticas?.totalClientes || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Ubicaciones"
              value={estadisticas?.totalUbicaciones || 0}
              prefix={<EnvironmentOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Con Ubicación Principal"
              value={estadisticas?.clientesConUbicacionPrincipal || 0}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
              suffix={`/ ${estadisticas?.totalClientes || 0}`}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Problemas Detectados"
              value={problemasIntegridad.length}
              prefix={<ExclamationCircleOutlined />}
              valueStyle={{ color: hayProblemas ? '#ff4d4f' : '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Gráficos y detalles */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card 
            title="Estado de Ubicaciones Principales"
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={() => {
                  setTipoModal('estadisticas');
                  setModalVisible(true);
                }}
              >
                Ver Más
              </Button>
            }
          >
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <Progress
                type="circle"
                percent={porcentajeUbicacionesPrincipales}
                format={() => `${porcentajeUbicacionesPrincipales}%`}
                strokeColor={porcentajeUbicacionesPrincipales >= 80 ? '#52c41a' : porcentajeUbicacionesPrincipales >= 60 ? '#faad14' : '#ff4d4f'}
              />
              <div style={{ marginTop: '8px', fontSize: '14px', color: '#666' }}>
                Clientes con ubicación principal configurada
              </div>
            </div>

            <Row gutter={16}>
              <Col span={12}>
                <Statistic
                  title="Configurados"
                  value={estadisticas?.clientesConUbicacionPrincipal || 0}
                  valueStyle={{ color: '#52c41a', fontSize: '18px' }}
                />
              </Col>
              <Col span={12}>
                <Statistic
                  title="Sin Configurar"
                  value={estadisticas?.clientesSinUbicacionPrincipal || 0}
                  valueStyle={{ color: '#ff4d4f', fontSize: '18px' }}
                />
              </Col>
            </Row>
          </Card>
        </Col>

        <Col xs={24} md={12}>
          <Card 
            title="Distribución por Estado"
            extra={
              <Button 
                type="link" 
                size="small"
                onClick={cargarDatos}
                icon={<SyncOutlined />}
              >
                Actualizar
              </Button>
            }
          >
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Clientes sin ubicaciones:</span>
                <Tag color="red">{estadisticas?.clientesSinUbicaciones || 0}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Sin ubicación principal:</span>
                <Tag color="orange">{estadisticas?.clientesSinUbicacionPrincipal || 0}</Tag>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span>Completamente configurados:</span>
                <Tag color="green">{estadisticas?.clientesConUbicacionPrincipal || 0}</Tag>
              </div>
            </div>

            {estadisticas && (
              <div style={{ fontSize: '12px', color: '#666' }}>
                Promedio de ubicaciones por cliente: {estadisticas.promedioUbicacionesPorCliente.toFixed(1)}
              </div>
            )}
          </Card>
        </Col>
      </Row>

      {/* Sectores con más clientes */}
      {estadisticas && Object.keys(estadisticas.porSector).length > 0 && (
        <Row style={{ marginTop: '16px' }}>
          <Col span={24}>
            <Card title="Distribución por Sectores">
              <Row gutter={[8, 8]}>
                {Object.entries(estadisticas.porSector)
                  .sort(([,a], [,b]) => b - a)
                  .slice(0, 8)
                  .map(([sector, cantidad]) => (
                    <Col key={sector} xs={12} sm={8} md={6} lg={3}>
                      <div style={{ 
                        textAlign: 'center', 
                        padding: '8px', 
                        border: '1px solid #f0f0f0', 
                        borderRadius: '4px' 
                      }}>
                        <div style={{ fontWeight: 'bold', color: '#1890ff' }}>{cantidad}</div>
                        <div style={{ fontSize: '12px', color: '#666' }}>{sector}</div>
                      </div>
                    </Col>
                  ))
                }
              </Row>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal para detalles */}
      <Modal
        title={
          tipoModal === 'estadisticas' ? 'Estadísticas Detalladas' :
          tipoModal === 'problemas' ? 'Problemas de Integridad' :
          'Resultado de Reparación'
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Cerrar
          </Button>
        ]}
        width={800}
      >
        {tipoModal === 'estadisticas' && estadisticas && (
          <div>
            <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
              <Col span={8}>
                <Statistic
                  title="Total de Clientes"
                  value={estadisticas.totalClientes}
                  prefix={<UserOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Total de Ubicaciones"
                  value={estadisticas.totalUbicaciones}
                  prefix={<EnvironmentOutlined />}
                />
              </Col>
              <Col span={8}>
                <Statistic
                  title="Promedio Ubicaciones/Cliente"
                  value={estadisticas.promedioUbicacionesPorCliente}
                  precision={1}
                />
              </Col>
            </Row>

            <h4>Distribución por Sectores</h4>
            <List
              size="small"
              dataSource={Object.entries(estadisticas.porSector)
                .sort(([,a], [,b]) => b - a)
                .map(([sector, cantidad]) => ({ sector, cantidad }))
              }
              renderItem={({ sector, cantidad }) => (
                <List.Item>
                  <span>{sector}</span>
                  <Tag color="blue">{cantidad} clientes</Tag>
                </List.Item>
              )}
            />
          </div>
        )}

        {tipoModal === 'problemas' && (
          <div>
            <Alert
              message={`Se encontraron ${problemasIntegridad.length} problemas`}
              description="Estos problemas pueden afectar el funcionamiento correcto del sistema"
              type="warning"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <Table
              columns={columnsProblemas}
              dataSource={problemasIntegridad}
              rowKey="codCliente"
              size="small"
              pagination={{ pageSize: 10 }}
            />

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Button 
                type="primary" 
                loading={loadingReparacion}
                onClick={repararProblemas}
                icon={<SyncOutlined />}
              >
                Reparar Todos los Problemas
              </Button>
            </div>
          </div>
        )}

        {tipoModal === 'reparacion' && (
          <div>
            <Alert
              message="Reparación Completada"
              description="Se han aplicado las correcciones automáticas"
              type="success"
              showIcon
              style={{ marginBottom: '16px' }}
            />
            
            <h4>Acciones Realizadas:</h4>
            <List
              size="small"
              dataSource={[]} // Aquí irían los detalles de la reparación
              renderItem={(detalle: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
                    title={`Cliente: ${detalle.codCliente}`}
                    description={detalle.accion}
                  />
                </List.Item>
              )}
            />
          </div>
        )}
      </Modal>
    </div>
  );
};

export default DashboardUbicaciones;
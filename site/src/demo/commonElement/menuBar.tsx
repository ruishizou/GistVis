import { Button, Flex, Layout, Typography } from 'antd';
import { Link } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;
const MenuBar = () => {
  return (
    <Header>
      <Flex align="center" justify="space-between">
        <Link to={`/`} style={{ fontSize: '24px', padding: '0 2%', fontWeight: 'bold', margin: 'auto 0' }}>
          GistVis
        </Link>
        {/* <Text style={{ fontSize: '24px', padding: '2%', fontWeight: 'bold' }}>GistVis</Text> */}
        <div>
          <Link to={`/home`}>
            <Button type="link">Home</Button>
          </Link>
          <Link to={`/Pipeline`}>
            <Button type="link">Pipeline explorer</Button>
          </Link>
          <Link to={`/userstudy`}>
            <Button type="link">User study interface</Button>
          </Link>
          <Link to={`/llm_setting`}>
            <Button type="link">Setting</Button>
          </Link>
        </div>
      </Flex>
    </Header>
  );
};

export default MenuBar;

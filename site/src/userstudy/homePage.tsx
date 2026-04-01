import { Link } from 'react-router-dom';
import { useAtom } from 'jotai';
import { articleIdAtom } from '../globalState';
import MenuBar from '../demo/commonElement/menuBar';
import { ConfigProvider } from 'antd';
import THEME from '../style/theme';

const HomePage = () => {
  const rootRoute = import.meta.env.VITE_SITE_BASE_URL;
  const width = window.innerHeight;
  const [, setArticleId] = useAtom(articleIdAtom);
  const handleButtonClick = (articleNumber: string) => {
    setArticleId(articleNumber);
  };
  return (
    <>
      <ConfigProvider theme={THEME}>
        <MenuBar />
      </ConfigProvider>
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'column',
          padding: '50px',
          height: width,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-evenly',
            width: '100%',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            {[
              'Unprocessed article 1',
              'Unprocessed article 2',
              'Unprocessed article 3',
              'Unprocessed article 4',
              'Unprocessed article 5',
              'Unprocessed article 6',
            ].map((article, index) => (
              <Link
                key={index}
                to={`/userstudy/unprocessed/${index + 1}`}
                style={{ textDecoration: 'none', color: 'black' }}
              >
                <button
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    margin: '5px',
                    width: '100%',
                  }}
                  onClick={() => handleButtonClick(`Unprocessed_${index + 1}`)}
                >
                  {article}
                </button>
              </Link>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginLeft: '20px',
            }}
          >
            {[
              'Processed article 1',
              'Processed article 2',
              'Processed article 3',
              'Processed article 4',
              'Processed article 5',
              'Processed article 6',
            ].map((article, index) => (
              <Link
                key={index}
                to={`/userstudy/processed/${index + 1}`}
                style={{ textDecoration: 'none', color: 'black' }}
              >
                <button
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    margin: '5px',
                    width: '100%',
                  }}
                  onClick={() => handleButtonClick(`Processed_${index + 1}`)}
                >
                  {article}
                </button>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;

import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

// material-ui
import { Box, Container, Toolbar, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';

// project import
import Breadcrumbs from 'components/@extended/Breadcrumbs';
import Header from './Header';
import Navigation from './Navigation';
import useConfig from 'hooks/useConfig';
import navigation from 'menu-items';
import AppSelectionPage from 'pages/AppSelection/AppSelectionPage';
import { dispatch } from 'store';
import { openDrawer } from 'store/reducers/menu';

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
  const theme = useTheme();
  const matchDownXL = useMediaQuery(theme.breakpoints.down('xl'));
  const location = useLocation();
  const pathName = location.pathname;
  const { container, miniDrawer } = useConfig();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // Set media-wise responsive drawer
  useEffect(() => {
    if (!miniDrawer) {
      dispatch(openDrawer(!matchDownXL));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchDownXL]);

  return (
    <Box
      sx={{
        display: 'flex',
        width: '100%',
        ...(pathName.substring(1) === 'apps' && { backgroundColor: '#082A89' })
      }}
    >
      {pathName.substring(1) === 'apps' ? (
        <div className="m-8 sm:m-28">
          <AppSelectionPage />
        </div>
      ) : (
        <>
          <Navigation isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />

          <Header isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
          {/* Always use Drawer for vertical menu */}
          <Box
            component="main"
            sx={{
              marginLeft: { xs: 0, sm: 0, md: isCollapsed ? '80px' : '180px' }, // ✅ 0 on mobile
              width: { xs: '100%', sm: '100%', md: isCollapsed ? 'calc(100% - 80px)' : 'calc(100% - 180px)' }, // ✅ full width on mobile
              flexGrow: 1,
              p: { xs: 1, sm: 1 },
              transition: 'margin-left 0.2s ease'
            }}
          >
            <Toolbar />
            <Container
              maxWidth={container ? 'xl' : false}
              sx={{
                ...(container && { px: { xs: 0, sm: 1 } }),
                position: 'relative',
                minHeight: 'calc(100vh - 110px)',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {!pathName.includes('/wms/transactions/inbound/jobs') && !pathName.includes('wms/transactions/outbound/jobs_oub') && (
                <Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} />
              )}

              {/* Main content here */}
              <Outlet />
              {/* <Footer /> */}
            </Container>
          </Box>
        </>
      )}
    </Box>
  );
};

export default MainLayout;

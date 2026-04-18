import { Typography, Box } from '@mui/material';
import AppIcon from 'components/AppIcon';
import useAuth from 'hooks/useAuth';
import useScreenSize from 'hooks/useScreenSize';
import { useNavigate } from 'react-router';
import { dispatch } from 'store';
import { setSelectedApp } from 'store/reducers/customReducer/slice.menuSelectionSlice';
import { activeID, activeItem } from 'store/reducers/menu';
import type { NavItemType } from 'types/menu';

const AppSelectionPage = () => {
  const { permissionBasedMenuTree } = useAuth();
  const { isMobile } = useScreenSize();
  const navigate = useNavigate();

  const handleSelectApp = (item: NavItemType) => {
    dispatch(setSelectedApp(item.url_path));
    dispatch(activeID(null));
    dispatch(activeItem({ openItem: [''] }));
    navigate(`${item.url_path}/dashboard`);
  };

  const MobileView = () => (
    <Box className="min-h-screen w-full p-4 flex flex-col items-center justify-start pt-6 bg-transparent">
      {/* Inner Container Box */}
      <Box className="bg-white rounded-3xl p-5 shadow-2xl w-full">
        {/* Header Section */}
        <Box className="mb-6">
          <Typography className="text-2xl font-black tracking-tight mb-2" style={{ color: '#082A89' }}>
            Pick Your Vibe
          </Typography>
          <Typography className="text-gray-500 text-xs font-medium">Choose your workspace & crush it</Typography>
        </Box>

        {/* App Cards Grid - Responsive */}
        <div className="w-full grid grid-cols-2 gap-3">
          {permissionBasedMenuTree?.map((eachApplication) => (
            <Box
              key={eachApplication.id}
              className="bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-3 flex flex-col items-center justify-center text-center gap-2 transition-all duration-300 hover:shadow-xl cursor-pointer shadow-sm transform active:scale-[0.99]"
              onClick={() => handleSelectApp(eachApplication as NavItemType)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectApp(eachApplication as NavItemType);
                }
              }}
            >
              <Box className="flex justify-center items-center w-12 h-12 bg-white/60 rounded-xl backdrop-blur-sm border border-gray-200 text-[#082A89]">
                <AppIcon item={eachApplication} variant="card" />
              </Box>

              <Typography className="text-sm font-extrabold line-clamp-2 px-1 text-[#082A89]">
                {eachApplication.title}
              </Typography>

              <Typography className="text-gray-500 text-[10px] font-semibold">Open</Typography>
            </Box>
          ))}
        </div>
      </Box>
    </Box>
  );

  const WebView = () => {
    const appCount = permissionBasedMenuTree?.length || 1;
    let gridCols = 'grid-cols-5';
    
    if (appCount === 1) gridCols = 'grid-cols-1';
    else if (appCount === 2) gridCols = 'grid-cols-2';
    else if (appCount <= 4) gridCols = 'grid-cols-4';
    else if (appCount <= 6) gridCols = 'grid-cols-6';
    else if (appCount <= 8) gridCols = 'grid-cols-4';
    else gridCols = 'grid-cols-5';

    return (
      <Box className="min-h-screen w-full p-5 flex items-start justify-center bg-transparent">
        {/* Inner Container Box */}
        <Box className="bg-white rounded-3xl p-8 shadow-2xl max-w-5xl w-full">
          {/* Header Section */}
          <Box className="mb-6">
            <Typography className="text-4xl font-black tracking-tighter mb-2" style={{ color: '#082A89' }}>
              Pick Your Vibe
            </Typography>
            <Typography className="text-gray-500 text-sm font-medium">
              Choose your workspace & let's get things done
            </Typography>
          </Box>

          {/* Apps Grid */}
          <div className={`grid ${gridCols} gap-4`}>
            {permissionBasedMenuTree?.map((eachApplication) => (
              <Box
                key={eachApplication.id}
                className="group bg-white/70 backdrop-blur-md border border-gray-200 rounded-2xl p-4 flex flex-col justify-center items-center transition-all duration-300 hover:shadow-xl hover:-translate-y-1 cursor-pointer shadow-sm overflow-hidden relative h-32 hover:bg-[#082A89] hover:border-[#082A89]"
                onClick={() => handleSelectApp(eachApplication as NavItemType)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSelectApp(eachApplication as NavItemType);
                  }
                }}
              >
                {/* Icon Container */}
                <Box className="flex justify-center items-center mb-2 transform transition-all duration-300 group-hover:scale-110 relative z-10">
                  <Box className="w-14 h-14 bg-white/60 rounded-xl backdrop-blur-md flex justify-center items-center transition-all duration-300 shadow-sm border border-gray-200 text-[#082A89] group-hover:text-white group-hover:bg-white/20 group-hover:border-white/20">
                    <AppIcon item={eachApplication} variant="card" />
                  </Box>
                </Box>

                {/* Text Container */}
                <Typography className="text-xs font-black text-center relative z-10 line-clamp-2 px-1 text-[#082A89] group-hover:text-white">
                  {eachApplication.title}
                </Typography>
                <Typography className="text-gray-500 text-[10px] font-semibold text-center relative z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 group-hover:text-white/80">
                  Open
                </Typography>
              </Box>
            ))}
          </div>
        </Box>
      </Box>
    );
  };

  return isMobile ? <MobileView /> : <WebView />;
};

export default AppSelectionPage;

import React from 'react';
import { Button, FormHelperText, Grid, InputAdornment, InputLabel, Link, OutlinedInput, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';

// third party
import { Formik } from 'formik';
import * as Yup from 'yup';

// project import
import AnimateButton from 'components/@extended/AnimateButton';
import IconButton from 'components/@extended/IconButton';

import useAuth from 'hooks/useAuth';
import useScriptRef from 'hooks/useScriptRef';

// assets
import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
import { Email as EmailIcon, Lock as LockIcon } from '@mui/icons-material'; // Added Email and Lock Icons

const AuthLogin = () => {
  const { login } = useAuth();
  const scriptedRef = useScriptRef();

  const [showPassword, setShowPassword] = React.useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: React.SyntheticEvent) => {
    event.preventDefault();
  };

  return (
    <>
      <Formik
        initialValues={{
          email: '',
          password: '',
          submit: null
        }}
        validationSchema={Yup.object().shape({
          email: Yup.string().max(255).required('Email is required'),
          password: Yup.string().max(255).required('Password is required')
        })}
        onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
          try {
            await login(values.email, values.password);
            if (scriptedRef.current) {
              setStatus({ success: true });
              setSubmitting(false);
            }
          } catch (err: any) {
            console.error(err);
            if (scriptedRef.current) {
              setStatus({ success: false });
              setErrors({ submit: err.message });
              setSubmitting(false);
            }
          }
        }}
      >
        {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
          <form noValidate onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="email-login">Email Address or Username</InputLabel>
                  <OutlinedInput
                    id="email-login"
                    value={values.email}
                    name="email"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    placeholder="Enter email address or Username"
                    fullWidth
                    error={Boolean(touched.email && errors.email)}
                    autoFocus
                    startAdornment={
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    }
                  />
                  {touched.email && errors.email && (
                    <FormHelperText error id="standard-weight-helper-text-email-login">
                      {errors.email}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <Stack spacing={1}>
                  <InputLabel htmlFor="password-login">Password</InputLabel>
                  <OutlinedInput
                    fullWidth
                    error={Boolean(touched.password && errors.password)}
                    id="password-login"
                    type={showPassword ? 'text' : 'password'}
                    value={values.password}
                    name="password"
                    onBlur={handleBlur}
                    onChange={handleChange}
                    endAdornment={
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={handleClickShowPassword}
                          onMouseDown={handleMouseDownPassword}
                          edge="end"
                          color="secondary"
                        >
                          {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                        </IconButton>
                      </InputAdornment>
                    }
                    placeholder="Enter password"
                    startAdornment={
                      <InputAdornment position="start">
                        <LockIcon />
                      </InputAdornment>
                    }
                  />
                  {touched.password && errors.password && (
                    <FormHelperText error id="standard-weight-helper-text-password-login">
                      {errors.password}
                    </FormHelperText>
                  )}
                </Stack>
              </Grid>

              <Grid item xs={12} sx={{ mt: -1 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
                  <Link variant="h6" component={RouterLink} to="/forgot-password" color="text.primary">
                    Forgot Password?
                  </Link>
                </Stack>
              </Grid>
              {errors.submit && (
                <Grid item xs={12}>
                  <FormHelperText error>{errors.submit}</FormHelperText>
                </Grid>
              )}
              <Grid item xs={12}>
                <AnimateButton>
                  <Button
                    disableElevation
                    disabled={isSubmitting}
                    fullWidth
                    size="large"
                    type="submit"
                    variant="contained"
                    sx={{
                      background:
                        'linear-gradient(270deg, rgba(2,0,36,1) 0%, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 81%, rgba(8,25,132,1) 100%)',
                      color: 'white',
                      '&:hover': {
                        background:
                          'linear-gradient(270deg, rgba(2,0,36,1) 0%, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 81%, rgba(8,25,132,1) 100%)'
                      }
                    }}
                  >
                    Login
                  </Button>
                </AnimateButton>
              </Grid>
            </Grid>
          </form>
        )}
      </Formik>
    </>
  );
};

export default AuthLogin;











// import React, { useEffect, useState } from 'react';
// import {
//   Button,
//   FormHelperText,
//   Grid,
//   InputAdornment,
//   InputLabel,
//   OutlinedInput,
//   Stack,
//   Alert,
//   CircularProgress,
//   Box,
//   Typography
// } from '@mui/material';

// // third party
// import { Formik } from 'formik';
// import * as Yup from 'yup';

// // project import
// import AnimateButton from 'components/@extended/AnimateButton';
// import IconButton from 'components/@extended/IconButton';
// import useAuth from 'hooks/useAuth';
// import useScriptRef from 'hooks/useScriptRef';

// // assets
// import { EyeInvisibleOutlined, EyeOutlined } from '@ant-design/icons';
// import { Email as EmailIcon, Lock as LockIcon, WifiOff, Wifi } from '@mui/icons-material';

// const AuthLogin = () => {
//   const { login } = useAuth();
//   const scriptedRef = useScriptRef();
//   const [showPassword, setShowPassword] = React.useState(false);
//   const [isOffline, setIsOffline] = useState(false);
//   const [isRetrying, setIsRetrying] = useState(false);
//   const [retryCount, setRetryCount] = useState(0);

//   // Get saved credentials
//   const savedEmail = localStorage.getItem('saved_email') || '';
//   const savedPassword = localStorage.getItem('saved_password') ? atob(localStorage.getItem('saved_password')!) : '';
//   const isOfflineRedirect = localStorage.getItem('connection_lost') === 'true';

//   useEffect(() => {
//     // Clear flag on mount
//     if (isOfflineRedirect) {
//       setIsOffline(true);
//       localStorage.removeItem('connection_lost');
//     }

//     // Listen for connection lost events
//     const handleConnectionLost = () => setIsOffline(true);
//     window.addEventListener('connection_lost', handleConnectionLost);
//     window.addEventListener('offline', handleConnectionLost);
//     window.addEventListener('online', () => setIsOffline(false));

//     return () => {
//       window.removeEventListener('connection_lost', handleConnectionLost);
//       window.removeEventListener('offline', handleConnectionLost);
//       window.removeEventListener('online', () => setIsOffline(false));
//     };
//   }, []);

//   // Auto-retry when offline with saved credentials
//   useEffect(() => {
//     if (!isOffline || !savedEmail || !savedPassword) return;

//     const retry = async () => {
//       setIsRetrying(true);
//       try {
//         await login(savedEmail, savedPassword);
//         setIsOffline(false); // success — clear offline state
//       } catch (e) {
//         setRetryCount((c) => c + 1);
//       } finally {
//         setIsRetrying(false);
//       }
//     };

//     // Auto-retry every 30 seconds
//     retry(); // try immediately
//     const interval = setInterval(retry, 30000);
//     return () => clearInterval(interval);
//   }, [isOffline]);

//   const handleClickShowPassword = () => setShowPassword(!showPassword);
//   const handleMouseDownPassword = (event: React.SyntheticEvent) => event.preventDefault();

//   // Show offline screen if connection lost
//   if (isOffline && savedEmail) {
//     return (
//       <Box sx={{ textAlign: 'center', py: 4 }}>
//         <WifiOff sx={{ fontSize: 64, color: 'warning.main', mb: 2 }} />
//         <Typography variant="h4" gutterBottom>
//           Connection Unavailable
//         </Typography>
//         <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
//           Please check your internet connection.
//           {retryCount > 0 && ` Retried ${retryCount} time${retryCount > 1 ? 's' : ''}.`}
//         </Typography>

//         {isRetrying ? (
//           <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 2 }}>
//             <CircularProgress size={20} />
//             <Typography variant="body2">Trying to reconnect...</Typography>
//           </Box>
//         ) : (
//           <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
//             Auto-retrying in 30 seconds...
//           </Typography>
//         )}

//         <Button
//           variant="contained"
//           startIcon={<Wifi />}
//           onClick={async () => {
//             setIsRetrying(true);
//             try {
//               await login(savedEmail, savedPassword);
//               setIsOffline(false);
//             } catch (e) {
//               setRetryCount((c) => c + 1);
//             } finally {
//               setIsRetrying(false);
//             }
//           }}
//           disabled={isRetrying}
//           sx={{ mb: 2 }}
//         >
//           {isRetrying ? 'Retrying...' : 'Retry Now'}
//         </Button>

//         <Box sx={{ mt: 2 }}>
//           <Button variant="text" size="small" onClick={() => setIsOffline(false)}>
//             Login with different account
//           </Button>
//         </Box>
//       </Box>
//     );
//   }

//   return (
//     <>
//       {isOfflineRedirect && !savedEmail && (
//         <Alert severity="warning" sx={{ mb: 2 }} icon={<WifiOff />}>
//           Connection was lost. Please check your internet and try again.
//         </Alert>
//       )}

//       <Formik
//         initialValues={{
//           email: savedEmail,
//           password: savedPassword,
//           submit: null
//         }}
//         validationSchema={Yup.object().shape({
//           email: Yup.string().max(255).required('Email is required'),
//           password: Yup.string().max(255).required('Password is required')
//         })}
//         onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
//           try {
//             await login(values.email, values.password);
//             if (scriptedRef.current) {
//               setStatus({ success: true });
//               setSubmitting(false);
//             }
//           } catch (err: any) {
//             console.error(err);
//             if (scriptedRef.current) {
//               setStatus({ success: false });
//               setErrors({ submit: err.message });
//               setSubmitting(false);
//             }
//           }
//         }}
//       >
//         {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
//           <form noValidate onSubmit={handleSubmit}>
//             <Grid container spacing={3}>
//               <Grid item xs={12}>
//                 <Stack spacing={1}>
//                   <InputLabel htmlFor="email-login">Email Address or Username</InputLabel>
//                   <OutlinedInput
//                     id="email-login"
//                     value={values.email}
//                     name="email"
//                     onBlur={handleBlur}
//                     onChange={handleChange}
//                     placeholder="Enter email address or Username"
//                     fullWidth
//                     error={Boolean(touched.email && errors.email)}
//                     autoFocus={!savedEmail}
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <EmailIcon />
//                       </InputAdornment>
//                     }
//                   />
//                   {touched.email && errors.email && <FormHelperText error>{errors.email}</FormHelperText>}
//                 </Stack>
//               </Grid>

//               <Grid item xs={12}>
//                 <Stack spacing={1}>
//                   <InputLabel htmlFor="password-login">Password</InputLabel>
//                   <OutlinedInput
//                     fullWidth
//                     error={Boolean(touched.password && errors.password)}
//                     id="password-login"
//                     type={showPassword ? 'text' : 'password'}
//                     value={values.password}
//                     name="password"
//                     onBlur={handleBlur}
//                     onChange={handleChange}
//                     endAdornment={
//                       <InputAdornment position="end">
//                         <IconButton
//                           aria-label="toggle password visibility"
//                           onClick={handleClickShowPassword}
//                           onMouseDown={handleMouseDownPassword}
//                           edge="end"
//                           color="secondary"
//                         >
//                           {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
//                         </IconButton>
//                       </InputAdornment>
//                     }
//                     placeholder="Enter password"
//                     startAdornment={
//                       <InputAdornment position="start">
//                         <LockIcon />
//                       </InputAdornment>
//                     }
//                   />
//                   {touched.password && errors.password && <FormHelperText error>{errors.password}</FormHelperText>}
//                 </Stack>
//               </Grid>

//               {errors.submit && (
//                 <Grid item xs={12}>
//                   <FormHelperText error>{errors.submit}</FormHelperText>
//                 </Grid>
//               )}

//               <Grid item xs={12}>
//                 <AnimateButton>
//                   <Button
//                     disableElevation
//                     disabled={isSubmitting}
//                     fullWidth
//                     size="large"
//                     type="submit"
//                     variant="contained"
//                     sx={{
//                       background:
//                         'linear-gradient(270deg, rgba(2,0,36,1) 0%, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 81%, rgba(8,25,132,1) 100%)',
//                       color: 'white',
//                       '&:hover': {
//                         background:
//                           'linear-gradient(270deg, rgba(2,0,36,1) 0%, rgba(0,212,255,1) 0%, rgba(9,9,121,1) 81%, rgba(8,25,132,1) 100%)'
//                       }
//                     }}
//                   >
//                     {isSubmitting ? <CircularProgress size={20} color="inherit" /> : 'Login'}
//                   </Button>
//                 </AnimateButton>
//               </Grid>
//             </Grid>
//           </form>
//         )}
//       </Formik>
//     </>
//   );
// };

// export default AuthLogin;

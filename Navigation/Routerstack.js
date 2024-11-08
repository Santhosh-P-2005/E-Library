import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createMaterialBottomTabNavigator } from '@react-navigation/material-bottom-tabs';
import { Image } from 'react-native';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignupScreen from '../screens/SignupScreen';
import LoginScreen from '../screens/LoginScreen';
import UserScreen from '../screens/UserScreen';
import AdminScreen from '../screens/AdminScreen';
import UserDetailsScreen from '../screens/UserDetailsScreen';
import AddProductScreen from '../screens/AddProductScreen';
import SplashScreen from '../screens/SplashScreen';
import EditProductScreen from '../screens/EditProductScreen';
import HistoryScreen from '../screens/HistoryScreen';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { connectToDatabase } from '../firebase';

const Stack = createStackNavigator();
const Tab = createMaterialBottomTabNavigator();

const BottomTabAdmin = () => {
  return (
    <Tab.Navigator
      initialRouteName="Dashboard"
      activeColor="blue"
      inactiveColor="#888"
      barStyle={{ backgroundColor: 'white' }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../photos/admin.png')}
              style={{ width: 24, height: 24 }}
            />
          ),
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="User"
        component={UserScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../photos/user.png')} 
              style={{ width: 24, height: 24}}
            />
          ),
          tabBarLabel: 'User',
        }}
      />
    </Tab.Navigator>
  );
};

const RouteStack = () => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(connectToDatabase(), "users", currentUser.uid));
        setUserRole(userDoc.data().role);
      } else {
        setUser(null);
        setUserRole('');
      }
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          userRole === 'admin' ? (
            <>
              <Stack.Screen name="admin" component={BottomTabAdmin} />
              <Stack.Screen name="UserDetails" component={UserDetailsScreen} />
              <Stack.Screen name="History" component={HistoryScreen} />
              <Stack.Screen name="AddProduct" component={AddProductScreen} />
              <Stack.Screen name="EditProduct" component={EditProductScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="user" component={UserScreen} />
            </>
          )
        ) : (
          <>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Splashscreen" component={SplashScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RouteStack;

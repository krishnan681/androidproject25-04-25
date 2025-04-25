import React, {useContext} from 'react';
import {
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {AuthContext} from './AuthContext';

const Icecream = () => {
  const {user} = useContext(AuthContext);
  const navigation = useNavigation();

  const components = [
    {
      id: 1,
      name: 'Buyer Information ',
        image: require('../src/assets/images/Buyer.png'),
      route: 'BuyerInformation',
    },
  ];

  const headerComponent = () => (
    <Text style={styles.listHeadLine}> Icecream Specials</Text>
  );

  const renderItem = ({item}) => (
    <TouchableOpacity
      style={styles.item}
      onPress={() => {
        if (user) {
          navigation.navigate(item.route);
        } else {
          Alert.alert('Login Required', 'Please login to view this item.');
          navigation.navigate('Login');
        }
      }}>
      <View style={styles.avatarContainer}>
        <Image source={item.image} style={styles.avatar} />
      </View>
      <Text style={styles.name}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView>
      <FlatList
        ListHeaderComponentStyle={styles.listHeader}
        ListHeaderComponent={headerComponent}
        data={components}
        renderItem={renderItem}
        keyExtractor={item => item.id.toString()}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listHeader: {
    marginVertical: 20,
    paddingHorizontal: 16,
  },
  listHeadLine: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#aa336a',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginHorizontal: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  separator: {
    height: 10,
  },
});

export default Icecream;

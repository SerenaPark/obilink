export NDK_TOOLCHAIN_VERSION=4.4.3

cd openssl-android
ndk-build

cd ..

cd anode
ndk-build NDK_PROJECT_PATH=. NDK_APPLICATION_MK=Application.mk

cp libs/armeabi/libjninode.so ./app/assets/
cp libs/armeabi/bridge.node ./app/assets/

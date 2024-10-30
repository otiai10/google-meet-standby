
clean:
	rm -rf dist
	rm -rf release

build:
	pnpm build
	cp -r src/_locales dist/_locales

release: clean build
	mkdir -p release	
	cp -r dist release/standby-google-meet
	zip -r release/standby-google-meet.zip release/standby-google-meet/*

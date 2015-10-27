module.exports = function(grunt) {

    grunt.initConfig({

        // Import package manifest
        pkg: grunt.file.readJSON("package.json"),

        // Banner definitions
        meta: {
            banner: "/*\n" +
                " *  <%= pkg.title || pkg.name %> - v<%= pkg.version %>\n" +
                " *  <%= pkg.description %>\n" +
                " *  <%= pkg.homepage %>\n" +
                " *\n" +
                " *  Made by <%= pkg.author.name %>\n" +
                " *  Under <%= pkg.license %> License\n" +
                " */\n"
        },

        // Concat definitions
        concat: {
            options: {
                banner: "<%= meta.banner %>"
            },
            dist: {
                src: ["src/jquery.slide.js"],
                dest: "dist/jquery.slide.js"
            }
        },

        // Lint definitions
        jshint: {
            files: ["src/jquery.slide.js"],
            options: {
                jshintrc: ".jshintrc"
            }
        },

        // Minify definitions
        uglify: {
            my_target: {
                src: ["dist/jquery.slide.js"],
                dest: "dist/jquery.slide.min.js"
            },
            options: {
                banner: "<%= meta.banner %>",
                mangle:true,
                report:'gzip',
                compress:true
            }
        },

        sass: {
            dist: {
                options: {
                    sourcemap: 'none'
                },
                files: {
                    'dist/jquery.slide.css': 'src/jquery.slide.scss'
                }
            }
        },

        cssmin: {
            target: {
                files: {
                    'dist/jquery.slide.min.css': ['dist/jquery.slide.css']
                }
            }
        },

        // watch for changes to source
        // Better than calling grunt a million times
        // (call 'grunt watch')
        watch: {
            files: ['src/*'],
            tasks: ['default']
        }

    });

    grunt.loadNpmTasks("grunt-contrib-concat");
    grunt.loadNpmTasks("grunt-contrib-jshint");
    grunt.loadNpmTasks("grunt-contrib-uglify");
    grunt.loadNpmTasks("grunt-contrib-watch");
    grunt.loadNpmTasks("grunt-contrib-cssmin");
    grunt.loadNpmTasks("grunt-contrib-sass");


    grunt.registerTask("build", ["concat", "uglify", "sass", "cssmin"]);
    grunt.registerTask("default", ["jshint", "build"]);
    grunt.registerTask("travis", ["default"]);

};

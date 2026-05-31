#!/usr/bin/env perl
use strict;
use warnings;
use FindBin;
use File::Spec;

# Must be set before the app loads its DB connection
my $TEST_DB = File::Spec->catfile($FindBin::Bin, 'fixtures', 'test.db');
$ENV{BADLAND_DB}     = $TEST_DB;
$ENV{MOJO_LOG_LEVEL} = 'fatal';

use DBI;
use Test::More;
use Test::Mojo;

# ── Fixture setup ──────────────────────────────────────────────────────────────

{
    my $dir = File::Spec->catdir($FindBin::Bin, 'fixtures');
    mkdir $dir unless -d $dir;
    unlink $TEST_DB if -f $TEST_DB;

    my $dbh = DBI->connect(
        "dbi:SQLite:dbname=$TEST_DB", '', '',
        { RaiseError => 1, AutoCommit => 1 }
    );

    $dbh->do(q{
        CREATE TABLE song (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            file  TEXT    NOT NULL,
            song  TEXT    NOT NULL,
            score INTEGER NOT NULL DEFAULT 0
        )
    });
    $dbh->do(q{
        CREATE TABLE ascii (
            id    INTEGER PRIMARY KEY AUTOINCREMENT,
            ascii TEXT    NOT NULL
        )
    });

    $dbh->do("INSERT INTO song (file, song, score) VALUES ('song1.mp3', 'Test Song One', 5)");
    $dbh->do("INSERT INTO song (file, song, score) VALUES ('song2.mp3', 'Test Song Two', 1)");
    $dbh->do("INSERT INTO ascii (ascii) VALUES (' o \n/|\\\n/ \\')");
    $dbh->disconnect;
}

END { unlink $TEST_DB if -f $TEST_DB }

# ── Load application ──────────────────────────────────────────────────────────
# app->start in badland.pl is guarded with `unless caller`, so do() is safe.
# After do(), Mojolicious::Lite has exported app() into our namespace.

do File::Spec->catfile($FindBin::Bin, '..', 'badland.pl');
die "Failed to load app: $@" if $@;

my $t = Test::Mojo->new(app());

# ── GET / ──────────────────────────────────────────────────────────────────────

subtest 'GET / serves the SPA shell' => sub {
    $t->get_ok('/')
      ->status_is(200)
      ->content_like(qr/ng-app="Badland"/, 'page has ng-app directive')
      ->content_like(qr/<ng-view>/, 'page has ng-view element');
};


done_testing;

/* eslint-disable react-hooks/rules-of-hooks */
/* eslint-disable react/no-danger */
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import Prismic from '@prismicio/client';
import { useRouter } from 'next/router';
import { RichText } from 'prismic-dom';
import { Fragment, useEffect, useState } from 'react';
import { FiCalendar, FiUser, FiClock } from 'react-icons/fi';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface Section {
  heading: string;
  body: {
    text: string;
  }[];
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  const [estimatedReadingTime, setEstimatedReadingTime] = useState(0);

  const router = useRouter();

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }

  useEffect(() => {
    const textHeading = post.data.content.map(item => item.heading);
    const textBody = post.data.content.map(item => RichText.asText(item.body));

    const wordsArray = [...textBody, ...textHeading];

    const allWords = wordsArray
      .reduce((total, array) => total + array)
      .split(' ');

    const timeRead = Math.ceil(allWords.length / 200);

    setEstimatedReadingTime(timeRead);
  }, [post.data.content]);

  return (
    <>
      <Head>
        <title>{post.data.title} | spacetraveling</title>
      </Head>
      <img
        className={styles.banner}
        src={post.data.banner.url}
        alt="post banner"
      />
      <main className={commonStyles.container}>
        <div className={styles.postContent}>
          <h1>{post.data.title}</h1>
          <div className={commonStyles.infos}>
            <FiCalendar />
            <span>
              {format(new Date(post.first_publication_date), 'd MMM y', {
                locale: ptBR,
              })}
            </span>
            <FiUser />
            <span>{post.data.author}</span>
            <FiClock />
            <span>{estimatedReadingTime} min</span>
          </div>
          {post.data.content.map(content => {
            return (
              <Fragment key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </Fragment>
            );
          })}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;

  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    first_publication_date: response.first_publication_date,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      author: response.data.author,
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map((section: Section) => {
        return {
          heading: section.heading,
          body: section.body.map(text => text),
        };
      }),
    },
  };

  return {
    props: {
      post,
    },
    revalidate: 60 * 60,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      pageSize: 10,
    }
  );
  const paths = postsResponse.results.map(result => {
    return {
      params: {
        slug: result.uid,
      },
    };
  });

  return { paths, fallback: true };
};
